"""
3단계: 월별 출국심사 통계 적재
- 내국인/외국인 x 전체/자동심사 인원을 DB에서 조회하여 CSV로 저장
- 전체 조회 후 4개 컬럼 모두 0이 아닌 유효 행 중 최신 2행만 저장
- 출력: data/{period}/step3-emigration-stats.csv
- 테스트 실행: python step3_load_emigration.py --start 20260212 --end 20260218
"""

import argparse
import os
import uuid

import pandas as pd

from common import get_connection, get_period_dir, load_sql_template, log, add_log_dir_arg, set_log_dir


def run(output_dir: str, start_date: str, end_date: str, transaction_id: str) -> None:
    sql_template = load_sql_template("emigration_stats.sql")

    log("[3단계 / 출국심사] 통계 전체 조회", transaction_id)

    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql_template)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
    finally:
        conn.close()

    df = pd.DataFrame(rows, columns=columns)
    for col in ["KOR_TOTAL", "KOR_AUTO", "FOREIGN_TOTAL", "FOREIGN_AUTO"]:
        df[col] = df[col].astype(int)

    end_yyyymm = end_date[:6]
    valid = df[(df["YM"] <= end_yyyymm) & (df["KOR_TOTAL"] > 0) & (df["KOR_AUTO"] > 0) & (df["FOREIGN_TOTAL"] > 0) & (df["FOREIGN_AUTO"] > 0)]
    result = valid.sort_values("YM", ascending=False).head(2).sort_values("YM", ascending=True).reset_index(drop=True)

    skipped = len(df) - len(valid)
    if skipped:
        log(f"0값 포함 행 제외: {skipped}행", transaction_id)

    output_path = os.path.join(output_dir, "step3-emigration-stats.csv")
    result.to_csv(output_path, index=False, encoding="utf-8-sig")
    log(f"완료: {output_path} ({len(result)}행)", transaction_id)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end",   required=True, help="수집 종료일 (YYYYMMDD)")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    output_dir = get_period_dir(args.start, args.end)
    os.makedirs(output_dir, exist_ok=True)
    run(output_dir, args.start, args.end, transaction_id)


if __name__ == "__main__":
    main()
