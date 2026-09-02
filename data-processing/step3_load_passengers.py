"""
3단계: 승객 태깅 시간 적재
- 2차 샘플링된 운항편의 개별 승객 기록을 시설물별 CSV로 저장
- 출력: data/{period}/step3-ck-passengers.csv, step3-dg-passengers.csv, step3-bg-passengers.csv
- 테스트 실행: python step3_load_passengers.py --start 20260212 --end 20260218
"""

import argparse
import os
import uuid
import pandas as pd

from common import get_connection, get_period_dir, load_sql_template, log, add_log_dir_arg, set_log_dir


def fetch_passenger_data(cursor, sql_template: str, fltsh_id_list: list, transaction_id: str) -> pd.DataFrame:
    placeholders = ",".join(["?"] * len(fltsh_id_list))
    query = sql_template.replace("{placeholders}", placeholders)
    log(f"[DEBUG] query: {query}", transaction_id)
    log(f"[DEBUG] params: {fltsh_id_list}", transaction_id)
    cursor.execute(query, fltsh_id_list)
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    return pd.DataFrame(rows, columns=columns)


def run(output_dir: str, transaction_id: str) -> None:
    sampled_path = os.path.join(output_dir, "step2-flights-sampled.csv")

    if not os.path.exists(sampled_path):
        log(f"파일 없음: {sampled_path}", transaction_id)
        return

    sampled = pd.read_csv(sampled_path, dtype=str)

    fltsh_id_list = sampled["FLTSH_ID"].dropna().tolist()
    if not fltsh_id_list:
        log("FLTSH_ID 목록이 비어 있습니다.", transaction_id)
        return

    ck_template = load_sql_template("passenger_ck.sql")
    dg_template = load_sql_template("passenger_dg.sql")
    bg_template = load_sql_template("passenger_bg.sql")

    log(f"[3단계] 승객 태깅 시간 적재 시작 - {len(fltsh_id_list)}편 대상", transaction_id)

    conn = get_connection()
    try:
        cursor = conn.cursor()

        log("[CK] 체크인카운터 조회", transaction_id)
        ck_df = fetch_passenger_data(cursor, ck_template, fltsh_id_list, transaction_id)
        log(f"  CK {len(ck_df)}건", transaction_id)

        log("[DG] 출국장 조회", transaction_id)
        dg_df = fetch_passenger_data(cursor, dg_template, fltsh_id_list, transaction_id)
        log(f"  DG {len(dg_df)}건", transaction_id)

        log("[BG] 보딩게이트 조회", transaction_id)
        bg_df = fetch_passenger_data(cursor, bg_template, fltsh_id_list, transaction_id)
        log(f"  BG {len(bg_df)}건", transaction_id)
    finally:
        conn.close()

    ck_df[["FLTSH_ID", "CHKN_SN", "DDLN_FLTNM", "YMD", "HM", "TMNL_ID", "CHECKED_ISLAND", "CHKN_ISTR_NO", "CHKN_SE_CD"]].to_csv(
        os.path.join(output_dir, "step3-ck-passengers.csv"), index=False, encoding="utf-8-sig"
    )
    dg_df[["FLTSH_ID", "CHKN_SN", "DDLN_FLTNM", "YMD", "HM", "TMNL_ID", "DG_NUMBER", "TRNST_ISTR_ID", "NTNLTY_CD", "DPTGT_ETRY_CD"]].to_csv(
        os.path.join(output_dir, "step3-dg-passengers.csv"), index=False, encoding="utf-8-sig"
    )
    bg_df[["FLTSH_ID", "CHKN_SN", "DDLN_FLTNM", "YMD", "HM"]].to_csv(
        os.path.join(output_dir, "step3-bg-passengers.csv"), index=False, encoding="utf-8-sig"
    )

    # FULL OUTER JOIN: 통합 CSV
    ck_total = ck_df[["FLTSH_ID", "CHKN_SN", "DDLN_FLTNM", "HM", "TMNL_ID", "CHECKED_ISLAND", "CHKN_ISTR_NO", "CHKN_SE_CD"]].rename(columns={
        "DDLN_FLTNM": "CK_DDLN_FLTNM", "HM": "CK_HM",
        "CHECKED_ISLAND": "CK_CHECKED_ISLAND", "CHKN_ISTR_NO": "CK_CHKN_ISTR_NO",
        "CHKN_SE_CD": "CK_CHKN_SE_CD",
    })
    dg_total = dg_df[["FLTSH_ID", "CHKN_SN", "HM", "DG_NUMBER", "TRNST_ISTR_ID", "NTNLTY_CD"]].rename(columns={
        "HM": "DG_HM", "DG_NUMBER": "DG_DG_NUMBER", "TRNST_ISTR_ID": "DG_TRNST_ISTR_ID", "NTNLTY_CD": "DG_NTNLTY_CD",
    })
    bg_total = bg_df[["FLTSH_ID", "CHKN_SN", "HM"]].rename(columns={"HM": "BG_HM"})

    merged = (
        ck_total
        .merge(dg_total, on=["FLTSH_ID", "CHKN_SN"], how="outer")
        .merge(bg_total, on=["FLTSH_ID", "CHKN_SN"], how="outer")
    )[["FLTSH_ID", "CHKN_SN", "TMNL_ID", "CK_DDLN_FLTNM", "CK_CHECKED_ISLAND", "CK_CHKN_ISTR_NO", "CK_CHKN_SE_CD",
       "DG_DG_NUMBER", "DG_TRNST_ISTR_ID", "DG_NTNLTY_CD", "CK_HM", "DG_HM", "BG_HM"]]
    merged.to_csv(os.path.join(output_dir, "step3-ck-dg-bg-passengers.csv"), index=False, encoding="utf-8-sig")
    log(f"통합 audit {len(merged)}건 저장", transaction_id)
    log(f"완료 - CK: {len(ck_df)}건 / DG: {len(dg_df)}건 / BG: {len(bg_df)}건 / 저장 위치: {output_dir}", transaction_id)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end",   required=True, help="수집 종료일 (YYYYMMDD)")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    output_dir = get_period_dir(args.start, args.end)
    run(output_dir, transaction_id)


if __name__ == "__main__":
    main()
