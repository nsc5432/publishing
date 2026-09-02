"""
1단계: 운항편 샘플링 & CSV 적재
- 날짜별 루프로 1주일치 운항편 데이터 추출
- 출력: data/{period}/step1-flights-all.csv
- 테스트 실행: python step1_load_flights.py --start 20260212 --end 20260218
"""

import argparse
import os
import uuid
from datetime import datetime, timedelta
import pandas as pd
from config import BASE_DIR
from common import get_connection, load_sql_template, log, add_log_dir_arg, set_log_dir


def fetch_flights_for_date(cursor, query, target_date, transaction_id):
    # sampling_flights.sql 에 ? 파라미터가 4개 (GD, CK, BG, DG 날짜)
    params = [target_date, target_date, target_date, target_date]
    log(f"[DEBUG] query: {query}", transaction_id)
    log(f"[DEBUG] params: {params}", transaction_id)
    cursor.execute(query, params)
    columns = [desc[0] for desc in cursor.description]
    rows = cursor.fetchall()
    return pd.DataFrame(rows, columns=columns)


def run(output_dir: str, start_date: str, end_date: str, transaction_id: str) -> None:
    start = datetime.strptime(start_date, "%Y%m%d")
    end = datetime.strptime(end_date, "%Y%m%d")
    os.makedirs(output_dir, exist_ok=True)

    query = load_sql_template("sampling_flights.sql")
    frames = []

    log(f"[1단계] 운항편 샘플링 적재 시작: {start_date} ~ {end_date}", transaction_id)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        current = start
        while current <= end:
            date_str = current.strftime("%Y%m%d")
            df = fetch_flights_for_date(cursor, query, date_str, transaction_id)
            log(f"  {date_str} 조회 완료 - {len(df)}편", transaction_id)
            frames.append(df)
            current += timedelta(days=1)
    finally:
        conn.close()

    if not frames:
        log("데이터 없음", transaction_id)
        return

    result = pd.concat(frames, ignore_index=True)
    output_path = os.path.join(output_dir, "step1-flights-all.csv")
    result.to_csv(output_path, index=False, encoding="utf-8-sig")
    log(f"완료: {output_path} ({len(result)}행)", transaction_id)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end", required=True, help="수집 종료일 (YYYYMMDD)")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    period = f"{args.start[2:]}-{args.end[2:]}"
    output_dir = os.path.join(BASE_DIR, period)
    run(output_dir, args.start, args.end, transaction_id)


if __name__ == "__main__":
    main()
