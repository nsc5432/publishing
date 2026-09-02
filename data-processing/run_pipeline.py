"""
전체 파이프라인 실행: 데이터 적재(step1→2→3) → 시계열 분포 산출(step4) → 아일랜드별 출국장 진입 비율 산출(step4) → 체크인 유형 비율 산출(step4) → BSM 분포 산출(step4)
python run_pipeline.py --start 20260212 --end 20260218 --prior 260205-260211 --auto-yn Y

매주 월요일 새벽 1시 실행
0 1 * * 1 cd /path/to/data-processing && \
  python run_pipeline.py \
    --start 20260212 \
    --end   20260218 \
    --prior 260205-260211 \
    >> logs/pipeline.log 2>&1

날짜를 Shell에서 계산해 넘기려면:
0 1 * * 1 cd /path/to/data-processing && \
  S=$(date -d "last monday" +%Y%m%d) && \
  E=$(date -d "last sunday" +%Y%m%d) && \
  PS=$(date -d "2 mondays ago" +%y%m%d) && \
  PE=$(date -d "last monday - 1 day" +%y%m%d) && \
  python run_pipeline.py --start $S --end $E --prior ${PS}-${PE} \
    >> logs/pipeline.log 2>&1
"""

import argparse
import os
import sys
import uuid
from datetime import datetime

from config import BASE_DIR
from common import log, add_log_dir_arg, set_log_dir
from step1_load_flights import run as load_flights
from step2_sampling_flights import run as sample_flights
from step3_load_passengers import run as load_passengers
from step3_load_emigration import run as load_emigration
from step3_load_bsm import run as load_bsm
from step3_load_service_times import run as load_service_times
from step4_calc_timeseries import run as calc_timeseries
from step4_calc_dep_usage_rate import run as calc_dep_usage_rate
from step4_calc_departure_location_rate import run as calc_departure_location_rate
from step4_calc_nationality_rate import run as calc_nationality_rate
from step4_calc_emigration_rate import run as calc_emigration_rate
from step4_calc_checkin_type import run as calc_checkin_type
from step4_calc_bsm import run as calc_bsm
from step4_calc_service_times import run as calc_service_times
from step5_save import run as save_db
from step5_save_ance_rate import run as save_ance_rate


def main():
    parser = argparse.ArgumentParser(description="공항 내 승객 분포 산출 파이프라인")
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end",   required=True, help="수집 종료일 (YYYYMMDD)")
    parser.add_argument("--prior", required=True, help="step4 사전확률 폴더 (YYMMDD-YYMMDD)")
    parser.add_argument("--auto-yn", default="Y", help="자동 실행 여부 (Y/N, 기본 Y)")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    # 날짜 검증보다 먼저 확보해야 검증 실패 시에도 log() 에 넘길 수 있다.
    transaction_id = str(uuid.uuid4())[:8]

    for label, val in (("--start", args.start), ("--end", args.end)):
        try:
            datetime.strptime(val, "%Y%m%d")
        except ValueError:
            log(f"[오류] {label} 형식이 올바르지 않습니다: {val} (YYYYMMDD 필요)", transaction_id)
            sys.exit(1)

    period = f"{args.start[2:]}-{args.end[2:]}"
    output_dir = os.path.join(BASE_DIR, period)

    log(f"파이프라인 시작: {args.start} ~ {args.end}  (prior: {args.prior})", transaction_id)
    log("=" * 60, transaction_id)
    load_flights(output_dir, args.start, args.end, transaction_id)

    log("=" * 60, transaction_id)
    sample_flights(output_dir, transaction_id)

    log("=" * 60, transaction_id)
    load_passengers(output_dir, transaction_id)

    log("=" * 60, transaction_id)
    load_emigration(output_dir, args.start, args.end, transaction_id)

    log("=" * 60, transaction_id)
    load_bsm(output_dir, transaction_id)

    log("=" * 60, transaction_id)
    load_service_times(output_dir, transaction_id)

    log("=" * 60, transaction_id)
    calc_timeseries(output_dir, args.prior, transaction_id)

    log("=" * 60, transaction_id)
    calc_dep_usage_rate(output_dir, args.prior, transaction_id)

    log("=" * 60, transaction_id)
    calc_departure_location_rate(output_dir, args.prior, transaction_id)

    log("=" * 60, transaction_id)
    calc_nationality_rate(output_dir, args.prior, transaction_id)

    log("=" * 60, transaction_id)
    calc_emigration_rate(output_dir, transaction_id)

    log("=" * 60, transaction_id)
    calc_checkin_type(output_dir, args.prior, transaction_id)

    log("=" * 60, transaction_id)
    calc_bsm(output_dir, args.prior, transaction_id)

    log("=" * 60, transaction_id)
    calc_service_times(output_dir, transaction_id)

    log("=" * 60, transaction_id)
    save_db(output_dir, transaction_id, "db")

    log("=" * 60, transaction_id)
    save_ance_rate(output_dir, args.start, args.end, transaction_id, auto_yn=args.auto_yn)

    log("=" * 60, transaction_id)
    log("파이프라인 완료", transaction_id)
    log("=" * 60, transaction_id)


if __name__ == "__main__":
    main()
