"""
3단계: BSM 수하물 수 적재
- 2차 샘플링된 운항편의 운항편별 BSM 수하물 갯수를 CSV로 저장
- 출력: data/{period}/step3-bsm.csv
- 테스트 실행: python step3_load_bsm.py --start 20260212 --end 20260218
"""

import argparse
import os
import uuid
import pandas as pd
from common import get_connection, get_period_dir, load_sql_template, log, add_log_dir_arg, set_log_dir


def fetch_bsm_data(cursor, sql_template: str, fltsh_id_list: list, transaction_id: str) -> pd.DataFrame:
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

    bsm_template = load_sql_template("flight_bsm.sql")

    log(f"[3단계-BSM] BSM 수하물 수 적재 시작 - {len(fltsh_id_list)}편 대상", transaction_id)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        log("[BSM] 운항편별 BSM 수하물 수 조회", transaction_id)
        bsm_df = fetch_bsm_data(cursor, bsm_template, fltsh_id_list, transaction_id)
        log(f"  BSM {len(bsm_df)}건", transaction_id)
    finally:
        conn.close()

    bsm_df[["BSM_YMD", "DDLN_FLTNM", "FLTSH_ID", "PASSENGER_SEQ", "BSM_BAG_CNT"]].to_csv(
        os.path.join(output_dir, "step3-bsm.csv"), index=False, encoding="utf-8-sig"
    )

    log(f"완료 - BSM: {len(bsm_df)}건 / 저장 위치: {output_dir}", transaction_id)


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
