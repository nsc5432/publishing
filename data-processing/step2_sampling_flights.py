"""
2단계: 2차 샘플링
- (TMNL_ID, P_TIME_SECTION, CON_SE_CD, CARRIER_TYPE) 그룹별로 오차 합계 최소 운항편 1개 선택
- 최대 240편 (2 x 5 x 12 x 2)
- 출력: data/{period}/step2-flights-sampled.csv
- 테스트 실행: python step2_sample_flights.py --start 20260212 --end 20260218
"""

import argparse
import os
import re
import uuid
import pandas as pd
from config import DOMESTIC_CARRIERS
from common import get_period_dir, log, add_log_dir_arg, set_log_dir


def extract_carrier_code(ddln_fltnm: str) -> str:
    """DDLN_FLTNM 앞 2자리로 항공사 코드 추출 (KE123 → KE)"""
    match = re.match(r"^([A-Z0-9]{2})", ddln_fltnm.strip())
    return match.group(1) if match else ""

def classify_carrier(ddln_fltnm: str) -> str:
    code = extract_carrier_code(ddln_fltnm)
    return "국적사" if code in DOMESTIC_CARRIERS else "외항사"

def parse_err_columns(df: pd.DataFrame) -> pd.DataFrame:
    """CK_ERR/DG_ERR/BG_ERR 컬럼에서 '%' 제거 후 숫자형으로 변환"""
    for col in ("CK_ERR", "DG_ERR", "BG_ERR"):
        df[col] = df[col].astype(str).str.replace("%", "", regex=False).astype(float)
    return df

def run(output_dir: str, transaction_id: str) -> None:
    input_path = os.path.join(output_dir, "step1-flights-all.csv")

    if not os.path.exists(input_path):
        log(f"파일 없음: {input_path}", transaction_id)
        return

    df = pd.read_csv(input_path, dtype=str)
    df = parse_err_columns(df)

    df["CARRIER_TYPE"] = df["DDLN_FLTNM"].apply(classify_carrier)
    df["TOTAL_ERR"] = df["CK_ERR"] + df["DG_ERR"] + df["BG_ERR"]

    log(f"[2단계] 2차 샘플링 시작 / 전체 {len(df)}편", transaction_id)

    sampled = (
        df.sort_values("TOTAL_ERR")
          .groupby(["TMNL_ID", "P_TIME_SECTION", "CON_SE_CD", "CARRIER_TYPE"], as_index=False)
          .first()
    )

    sampled = sampled.drop(columns=["TOTAL_ERR"])

    output_path = os.path.join(output_dir, "step2-flights-sampled.csv")
    sampled.to_csv(output_path, index=False, encoding="utf-8-sig")

    log(f"완료: {output_path} ({len(sampled)}편 선택, 최대 240편)", transaction_id)


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
