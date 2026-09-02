"""
5단계: step4 산출 비율 -> DB 저장 또는 CSV 출력
- step5_mapping.py의 UPLOAD_TASKS에 정의된 태스크별로 step4 CSV를 읽어 처리
- 하나의 태스크는 1개 이상의 (composite_key, values) 그룹을 생성 (dep-usage(출국장이용분포)/checkin-type(체크인유형)은 다수)
- 실행 예시:
    python step5_save.py --start 20260212 --end 20260218 --mode csv
    python step5_save.py --start 20260212 --end 20260218 --mode db
"""

import argparse
import os
import uuid
import pandas as pd
from common import get_connection, get_period_dir, log, add_log_dir_arg, set_log_dir
from step5_mapping import (
    UPLOAD_TASKS,
    DEP_USAGE_BASE_CODE,
    DEP_USAGE_T2_BASE_CODE,
    ISLAND_ORDER,
    PRE_PRCS_GROUP_ID,
    CKIN_TYPE_TABLE,
    PSG_ATRB_TABLE,
    SHOW_UP_TABLE,
)

TERMINAL_GROUP = {"T1": PRE_PRCS_GROUP_ID, "T2": PRE_PRCS_GROUP_ID}
GROUP_TABLE = "PMOWN.TN_PM_SMLT_FIX_ATRB_GROUP"
MANAGED_GROUP_COLUMNS = {
    PSG_ATRB_TABLE: "FIX_ATRB_GROUP_ID",
    SHOW_UP_TABLE: "FIX_ATRB_GROUP_ID",
    CKIN_TYPE_TABLE: "CKNCT_TYPE_ATRB_ID",
}
REGIST_COLS_SQL = "FRST_RGTR_ID, FRST_RGTR_IP_ADDR, FRST_REG_DT"
REGIST_VALS_SQL = "'System', '0.0.0.0', CURRENT_TIMESTAMP"


def round_to_100(proportions: list[float]) -> list[int]:
    #비율 목록(합계: 1)을 정수로 변환하되 합계가 반드시 100이 되도록 보장
    raw = [v * 100 for v in proportions]
    floors = [int(v) for v in raw]
    total_diff = 100 - sum(floors)
    sorted_diff = sorted(range(len(raw)), key=lambda i: raw[i] - floors[i], reverse=True)
    for i in sorted_diff[:total_diff]:
        floors[i] += 1
    return floors


def build_sub_code(parent_code: str, index: int) -> str:
    return str(int(parent_code) + index + 1).zfill(8)


def upsert_data(conn, table_name: str, composite_key: dict, values: list[dict], transaction_id: str) -> None:
    cursor = conn.cursor()
    try:
        where_cols = list(composite_key.keys())
        where_sql = " AND ".join(f"{col} = ?" for col in where_cols)
        delete_sql = f"DELETE FROM {table_name} WHERE {where_sql}"
        cursor.execute(delete_sql, list(composite_key.values()))

        if not values:
            return

        all_cols = list(composite_key.keys()) + list(values[0].keys())
        cols_sql = ", ".join(all_cols)
        placeholders = ", ".join("?" for _ in all_cols)
        insert_sql = (
            f"INSERT INTO {table_name} ({cols_sql}, {REGIST_COLS_SQL}) "
            f"VALUES ({placeholders}, {REGIST_VALS_SQL})"
        )

        for row in values:
            params = list(composite_key.values()) + list(row.values())
            cursor.execute(insert_sql, params)
    finally:
        cursor.close()


def _load_filtered(task: dict, data_dir: str) -> "pd.DataFrame":
    csv_path = os.path.join(data_dir, task["read_file"])
    df = pd.read_csv(csv_path)
    if task.get("filter"):
        for col, val in task["filter"].items():
            df = df[df[col] == val]
    return df.reset_index(drop=True)


def _transform_raw(df: "pd.DataFrame", task: dict) -> list[str]:
    # 비율 컬럼을 정수 퍼센트 문자열 목록으로 변환 (합계=100 보장)
    if task.get("category_order"):
        col = task["category_col"]
        order = task["category_order"]
        df = df.set_index(col).loc[order].reset_index()
    values = df["POSTERIOR"].tolist()
    return [str(v) for v in round_to_100(values)]


def _transform_cumulative_percent(df: "pd.DataFrame", task: dict) -> list[str]:
    if task.get("agg_periods"):
        # 지정된 PERIOD들만 추출해 BIN_INDEX별 평균 posterior 계산
        sub = df[df["PERIOD"].isin(task["agg_periods"])]
        posterior = sub.groupby("BIN_INDEX")["POSTERIOR"].mean().sort_index().values
    else:
        posterior = df.sort_values("BIN_INDEX")["POSTERIOR"].values

    # 체크포인트 예시
    # CHECKPOINTS_GATE = [60, 45, 30, 20, 10]
    # cp=60 -> BIN_INDEX >= 6 (60//10) 이상의 POSTERIOR 합 x 100
    return [str(round(posterior[cp // 10:].sum() * 100)) for cp in task["checkpoints"]]


# (composite_key, values) 목록 생성
def _build_single_code_groups(task: dict, data_dir: str, transform_fn) -> list[tuple[dict, list[dict]]]:
    """단일 PSG_ATRB_CD를 fix_group_ids 수만큼 늘려서 반환.
    Return Type: [
        (
            {"FIX_ATRB_GROUP_ID": "999", "PSG_ATRB_CD": "01010000"},
            [
                {"PSG_DTL_SE_CD": "01010001", "INPT_VL": "60"},
                {"PSG_DTL_SE_CD": "01010002", "INPT_VL": "40"}
            ]
         )
    ]
    """
    df = _load_filtered(task, data_dir)
    parent_code: str = task["psg_atrb_cd"]
    INPT_VL_list = transform_fn(df, task)
    # PSG_DTL_SE_CD = parent_code + (index+1), INPT_VL = 변환된 정수 문자열
    values = [{"PSG_DTL_SE_CD": build_sub_code(parent_code, i), "INPT_VL": v} for i, v in enumerate(INPT_VL_list)]
    groups = []
    for gid in task["fix_group_ids"]:
        composite_key = {"FIX_ATRB_GROUP_ID": gid, "PSG_ATRB_CD": parent_code}
        groups.append((composite_key, values))
    return groups


def _build_island_dg_groups(task: dict, data_dir: str) -> list[tuple[dict, list[dict]]]:
    # 출국장이용분포
    df = pd.read_csv(os.path.join(data_dir, task["read_file"]))
    dg_cols = sorted([c for c in df.columns if c.startswith("DG_")])

    groups = []
    for _, row in df.iterrows():
        tmnl = str(row["TMNL_ID"])
        island = str(row["CHECKED_ISLAND"])
        if tmnl not in TERMINAL_GROUP or island not in ISLAND_ORDER:
            continue

        global_idx = ISLAND_ORDER.index(island)
        base = DEP_USAGE_T2_BASE_CODE if tmnl == "T2" else DEP_USAGE_BASE_CODE
        # T1: A(index=0)->17010000, Z(index=13)->17140000
        # T2: A(index=0)->17160000, Z(index=13)->17290000
        code = str(int(base) + global_idx * 10000).zfill(8)
        rounded = round_to_100([float(row[c]) for c in dg_cols])
        values = [{"PSG_DTL_SE_CD": build_sub_code(code, i), "INPT_VL": str(rounded[i])} for i in range(len(dg_cols))]
        composite_key = {"FIX_ATRB_GROUP_ID": TERMINAL_GROUP[tmnl], "PSG_ATRB_CD": code}
        groups.append((composite_key, values))
    return groups


def _build_ckin_type_groups(task: dict, data_dir: str) -> list[tuple[dict, list[dict]]]:
    # 체크인유형
    # CSV: ALN_CD, CHECKIN_TYPE(CK/SCI/MOBILE), PRIOR, POSTERIOR(0~1 비율)
    # DB: CKNCT_TYPE_ATRB_ID, ALN_CD, CKNCT_RT, CKNCT_VL, KOS_RT, KOS_VL, MOB_RT, MOB_VL
    df = pd.read_csv(os.path.join(data_dir, task["read_file"]))
    groups = []
    for gid in task["fix_group_ids"]:
        for aln, sub in df.groupby("ALN_CD"):
            composite_key = {"CKNCT_TYPE_ATRB_ID": gid, "ALN_CD": str(aln)}
            sub = sub.set_index("CHECKIN_TYPE")
            rounded = round_to_100([
                float(sub.at["CK", "POSTERIOR"]),
                float(sub.at["SCI", "POSTERIOR"]),
                float(sub.at["MOBILE", "POSTERIOR"]),
            ])
            values = [{
                "CKNCT_RT": rounded[0],
                "CKNCT_VL": "Counter",
                "KOS_RT": rounded[1],
                "KOS_VL": "Kiosk",
                "MOB_RT": rounded[2],
                "MOB_VL": "Mobile",
            }]

            groups.append((composite_key, values))
    return groups


def build_groups(task: dict, data_dir: str) -> list[tuple[dict, list[dict]]]:
    """ transform 종류:
        - "raw": _build_single_code_groups (단일 코드, 비율 그대로)
        - "cumulative_percent": _build_single_code_groups (단일 코드, 누적 퍼센트)
        - "island_dg": _build_island_dg_groups (출국장이용분포)
        - "ckin_type": _build_ckin_type_groups (항공사별 체크인 타입)
    """
    builders = {
        "raw": lambda t, d: _build_single_code_groups(t, d, _transform_raw),
        "cumulative_percent": lambda t, d: _build_single_code_groups(t, d, _transform_cumulative_percent),
        "island_dg": _build_island_dg_groups,
        "ckin_type": _build_ckin_type_groups,
    }
    transform = task["transform"]
    if transform not in builders:
        raise ValueError(f"알 수 없는 transform 값: {transform!r}")
    return builders[transform](task, data_dir)


def _save_csv(task: dict, data_dir: str, groups: list[tuple[dict, list[dict]]], transaction_id: str) -> None:
    # (composite_key, values) 목록을 평탄화해 하나의 DataFrame으로 저장
    # ex) ({"TMNL_ID": "T1"}, [{"BIN_INDEX": 1, "VALUE": 0.5}]) -> {"TMNL_ID": "T1", "BIN_INDEX": 1, "VALUE": 0.5}
    rows = [{**composite_key, **v} for composite_key, values in groups for v in values]
    out_path = os.path.join(data_dir, f"step5-{task['name']}.csv")
    pd.DataFrame(rows).to_csv(out_path, index=False, encoding="utf-8-sig")
    log(f"[{task['description']}] {len(rows)}건 -> {out_path}", transaction_id)


def save_upload(
    conn,
    task: dict,
    groups: list[tuple[dict, list[dict]]],
    data_dir: str,
    transaction_id: str,
    mode: str,
) -> None:
    if mode == "db":
        total = 0
        for composite_key, values in groups:
            upsert_data(conn, task["table"], composite_key, values, transaction_id)
            total += len(values)
        log(f"[{task['description']}] {len(groups)}그룹 {total}건 DB 저장 완료", transaction_id)
    else:
        _save_csv(task, data_dir, groups, transaction_id)


def assert_unique_keys(uploads: list[tuple[dict, list[tuple[dict, list[dict]]]]]) -> None:
    seen: dict[tuple[str, tuple[tuple[str, str], ...]], str] = {}

    for task, groups in uploads:
        for composite_key, _ in groups:
            key = (task["table"], tuple(sorted((column, str(value)) for column, value in composite_key.items())))
            previous = seen.get(key)
            if previous is not None:
                raise ValueError(
                    f"중복 적재 키: {task['table']} {dict(key[1])} "
                    f"({previous}, {task['description']}). 터미널별 속성코드를 분리해 주세요."
                )
            seen[key] = task["description"]


def prepare_pre_process_group(conn) -> None:
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"""
            MERGE INTO {GROUP_TABLE} T
            USING (SELECT ? AS FIX_ATRB_GROUP_ID FROM DUAL) S
               ON (T.FIX_ATRB_GROUP_ID = S.FIX_ATRB_GROUP_ID)
            WHEN NOT MATCHED THEN
                INSERT (FIX_ATRB_GROUP_ID, ATRB_GROUP_NM, CFMTN_YN, GROUP_PRCS_STTS_CD, DEL_YN,
                        FRST_RGTR_ID, FRST_RGTR_IP_ADDR, FRST_REG_DT)
                VALUES (?, '전처리 결과', 'N', '01', 'N', 'System', '0.0.0.0', CURRENT_TIMESTAMP)
            """,
            [PRE_PRCS_GROUP_ID, PRE_PRCS_GROUP_ID],
        )
        cursor.execute(
            f"SELECT FIX_ATRB_GROUP_ID FROM {GROUP_TABLE} WHERE FIX_ATRB_GROUP_ID = ? FOR UPDATE",
            [PRE_PRCS_GROUP_ID],
        )
        cursor.fetchone()

        for table_name, group_column in MANAGED_GROUP_COLUMNS.items():
            cursor.execute(
                f"DELETE FROM {table_name} WHERE {group_column} = ?",
                [PRE_PRCS_GROUP_ID],
            )
    finally:
        cursor.close()


def finish_pre_process_group(conn, period: str) -> None:
    cursor = conn.cursor()
    try:
        cursor.execute(
            f"""
            UPDATE {GROUP_TABLE}
               SET ATRB_GROUP_NM = ?,
                   DEL_YN = 'N',
                   LAST_MDFR_ID = 'System',
                   LAST_MDFR_IP_ADDR = '0.0.0.0',
                   LAST_MDFCN_DT = CURRENT_TIMESTAMP
             WHERE FIX_ATRB_GROUP_ID = ?
            """,
            [f"전처리 결과 ({period})", PRE_PRCS_GROUP_ID],
        )
    finally:
        cursor.close()


def run(data_dir: str, transaction_id: str, mode: str) -> None:
    uploads = [(task, build_groups(task, data_dir)) for task in UPLOAD_TASKS]

    if mode == "csv":
        for task, groups in uploads:
            save_upload(None, task, groups, data_dir, transaction_id, mode)
        log("전체 CSV 저장 완료", transaction_id)
    else:
        assert_unique_keys(uploads)
        conn = get_connection()
        try:
            prepare_pre_process_group(conn)
            for task, groups in uploads:
                save_upload(conn, task, groups, data_dir, transaction_id, mode)
            finish_pre_process_group(conn, os.path.basename(os.path.normpath(data_dir)))
            conn.commit()
            log("전체 DB 저장 완료", transaction_id)
        except Exception as e:
            conn.rollback()
            log(f"오류 발생, rollback: {e}", transaction_id)
            raise
        finally:
            conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="step4 산출 비율을 DB 또는 CSV로 저장")
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--mode", choices=["db", "csv"], default="csv")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    data_dir = get_period_dir(args.start, args.end)

    log(f"step5 시작 | 기간: {args.start}~{args.end} | 모드: {args.mode} | 디렉토리: {data_dir}", transaction_id)
    run(data_dir, transaction_id, args.mode)


if __name__ == "__main__":
    main()
