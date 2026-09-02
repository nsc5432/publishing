"""
5단계: step4 산출 비율 -> TN_PM_DATA_PRCS 마스터/결과 테이블 적재
- 실행 예시:
    python step5_save_ance_rate.py --start 20260212 --end 20260218
    python step5_save_ance_rate.py --start 20260212 --end 20260218 --auto-yn Y
"""

import argparse
import uuid
import os
import pandas as pd

from common import get_connection, get_period_dir, log, add_log_dir_arg, set_log_dir

MSTR_TABLE = "PMOWN.TN_PM_DATA_PRCS_MSTR"
RSLT_TABLE = "PMOWN.TN_PM_DATA_PRCS_RSLT"
TERMINAL_TMNL = {"T1": "P01", "T2": "P03"}
TERMINAL_DG_MAX = {"T1": 6, "T2": 2} # 터미널별 출국장 수

SE_SUR = "SUR"
SE_CIC = "CIC"

# 아일랜드(CHECKED_ISLAND) -> ENV_PSTN_NM 매핑 (순서 보존, 항상 24개 전체 생성)
# A·N은 1개, 나머지는 2개씩 (B 값은 B1, B2에 중복 저장)
ISLAND_PSTN = [
    ("A", ["A1"]),
    ("B", ["B1", "B2"]),
    ("C", ["C1", "C2"]),
    ("D", ["D1", "D2"]),
    ("E", ["E1", "E2"]),
    ("F", ["F1", "F2"]),
    ("G", ["G1", "G2"]),
    ("H", ["H1", "H2"]),
    ("J", ["J1", "J2"]),
    ("K", ["K1", "K2"]),
    ("L", ["L1", "L2"]),
    ("M", ["M1", "M2"]),
    ("N", ["N1"]),
]

REGIST_COLS_SQL = "FRST_RGTR_ID, FRST_RGTR_IP_ADDR, FRST_REG_DT"
REGIST_VALS_SQL = "'System', '0.0.0.0', CURRENT_TIMESTAMP"

def _dg_columns(df: pd.DataFrame) -> list[str]:
    return sorted(
        [c for c in df.columns if c.startswith("DG_")],
        key=lambda c: int(c.split("_")[1]),
    )


def build_sur_rows(data_dir: str, terminal: str) -> list[dict]:
    """출국장 시계열: ENV_PSTN_NM=PERIOD, ENV_HR_VL=BIN_INDEX+1, ENVAL_VL=POSTERIOR."""
    path = os.path.join(data_dir, f"step4-dg-{terminal.lower()}-rate.csv")
    df = pd.read_csv(path)
    rows = []
    for _, r in df.iterrows():
        rows.append({
            "ENV_PSTN_NM": str(r["PERIOD"]),
            "ENV_HR_VL": int(r["BIN_INDEX"]) + 1,
            "ENVAL_VL": float(r["POSTERIOR"]),
        })
    return rows


def build_cic_rows(data_dir: str, terminal: str) -> list[dict]:
    """출국장 이용분포: ENV_PSTN_NM=아일랜드 매핑(24개), ENV_HR_VL=DG번호, ENVAL_VL=가중치."""
    path = os.path.join(data_dir, "step4-dep-usage-rate.csv")
    df = pd.read_csv(path)
    df = df[df["TMNL_ID"] == terminal]
    dg_cols = [c for c in _dg_columns(df) if int(c.split("_")[1]) <= TERMINAL_DG_MAX[terminal]]
    dg_nums = [int(c.split("_")[1]) for c in dg_cols]
    by_island = df.set_index("CHECKED_ISLAND")

    rows = []
    for island, pstn_names in ISLAND_PSTN:
        if island in by_island.index:
            vals = [float(by_island.at[island, c]) for c in dg_cols]
        else:
            vals = [0.0] * len(dg_cols)
        for pstn in pstn_names:
            for dg_num, val in zip(dg_nums, vals):
                rows.append({
                    "ENV_PSTN_NM": pstn,
                    "ENV_HR_VL": dg_num,
                    "ENVAL_VL": val,
                })
    return rows


def next_master_seq(cursor) -> int:
    cursor.execute(f"SELECT COALESCE(MAX(SEQ), 0) FROM {MSTR_TABLE}")
    return int(cursor.fetchone()[0])


def next_sort_seq(cursor, bgng: str, end: str, tmnl: str, se: str) -> int:
    cursor.execute(
        f"SELECT COALESCE(MAX(SORT_SEQ), 0) + 1 FROM {MSTR_TABLE} "
        f"WHERE BGNG_YMD = ? AND END_YMD = ? AND TMNL_ID = ? AND DATA_PRE_PRCS_SE_CD = ?",
        [bgng, end, tmnl, se],
    )
    return int(cursor.fetchone()[0])


def insert_master(cursor, seq: int, bgng: str, end: str, tmnl: str, se: str,
                  sort_seq: int, auto_yn: str) -> None:
    cursor.execute(
        f"INSERT INTO {MSTR_TABLE} "
        f"(SEQ, BGNG_YMD, END_YMD, TMNL_ID, DATA_PRE_PRCS_SE_CD, SORT_SEQ, AUTO_YN, {REGIST_COLS_SQL}) "
        f"VALUES (?, ?, ?, ?, ?, ?, ?, {REGIST_VALS_SQL})",
        [seq, bgng, end, tmnl, se, sort_seq, auto_yn],
    )


def insert_results(cursor, mstr_seq: int, rows: list[dict]) -> None:
    if not rows:
        return
    params = [
        [mstr_seq, r["ENV_PSTN_NM"], r["ENV_HR_VL"], r["ENVAL_VL"]]
        for r in rows
    ]
    cursor.executemany(
        f"INSERT INTO {RSLT_TABLE} "
        f"(MSTR_SEQ, ENV_PSTN_NM, ENV_HR_VL, ENVAL_VL, {REGIST_COLS_SQL}) "
        f"VALUES (?, ?, ?, ?, {REGIST_VALS_SQL})",
        params,
    )


def run(output_dir: str, start: str, end: str, transaction_id: str, auto_yn: str = "N") -> None:
    auto_yn = auto_yn if auto_yn in ("Y", "N") else "N"
    log(f"step5(ance-rate) 시작 | 기간: {start}~{end} | AUTO_YN: {auto_yn} | 디렉토리: {output_dir}",
        transaction_id)

    builders = [(SE_SUR, build_sur_rows), (SE_CIC, build_cic_rows)]
    conn = get_connection()
    try:
        cursor = conn.cursor()
        seq = next_master_seq(cursor)
        for terminal in ["T1", "T2"]:
            tmnl_id = TERMINAL_TMNL[terminal]
            for se_cd, builder in builders:
                seq += 1
                sort_seq = next_sort_seq(cursor, start, end, tmnl_id, se_cd)
                insert_master(cursor, seq, start, end, tmnl_id, se_cd, sort_seq, auto_yn)
                rows = builder(output_dir, terminal)
                insert_results(cursor, seq, rows)
                log(f"[{tmnl_id}/{se_cd}] SEQ={seq} SORT_SEQ={sort_seq} 결과 {len(rows)}건 적재",
                    transaction_id)
        conn.commit()
        log("step5(ance-rate) DB 저장 완료", transaction_id)
    except Exception as e:
        conn.rollback()
        log(f"오류 발생, rollback: {e}", transaction_id)
        raise
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="step4 산출 비율을 TN_PM_DATA_PRCS 테이블에 저장")
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end", required=True, help="수집 종료일 (YYYYMMDD)")
    parser.add_argument("--auto-yn", default="N", help="자동 실행 여부 (Y/N, 기본 N)")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    output_dir = get_period_dir(args.start, args.end)
    run(output_dir, args.start, args.end, transaction_id, auto_yn=args.auto_yn)


if __name__ == "__main__":
    main()
