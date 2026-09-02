"""
4단계: BSM 수하물 수 분포 산출
- step2-flights-sampled.csv + step3-bsm.csv 기반으로 기간별 BSM_BAG_CNT 분포 산출
- 베이지안 업데이트로 사후확률 도출
- 유효 카테고리: 0, 1, 2, 3 (BSM_BAG_CNT >= 4인 승객은 likelihood 계산에서 제외)
- 사전확률: data/{prior_folder}/step4-bsm-rate.csv 의 POSTERIOR 컬럼
- 출력: data/{period}/step4-bsm-rate.csv
- 테스트 실행: python step4_calc_bsm.py --start 20260212 --end 20260218 --prior 260205-260211
"""

import argparse
import os
import uuid

import numpy as np
import pandas as pd

from config import BASE_DIR
from common import get_period_dir, log, compute_prior_counts, aggregate_posterior_rate, add_log_dir_arg, set_log_dir

PRIOR_PAX_RATIO = 0.9
BSM_BAG_COUNTS = [0, 1, 2, 3]
UNIFORM_PRIOR = np.array([0.22, 0.61, 0.14, 0.03])  # 3단계 CAST 세팅 기본값 (BAG0/BAG1/BAG2/BAG3 순서)


def load_prior(folder_name: str) -> np.ndarray:
    path = os.path.join(BASE_DIR, folder_name, "step4-bsm-rate.csv")
    if not os.path.exists(path):
        return UNIFORM_PRIOR.copy()
    df = pd.read_csv(path).set_index("BSM_BAG_CNT")["POSTERIOR"]
    return np.array([float(df.get(k, UNIFORM_PRIOR[i])) for i, k in enumerate(BSM_BAG_COUNTS)])


def collect_bsm_counts(
    sampled: pd.DataFrame,
    bsm: pd.DataFrame,
    prior: np.ndarray,
) -> list[tuple[str, np.ndarray, np.ndarray]]:
    result: list[tuple[str, np.ndarray, np.ndarray]] = []

    bsm = bsm.copy()
    bsm["BSM_BAG_CNT"] = pd.to_numeric(bsm["BSM_BAG_CNT"], errors="coerce")
    bsm = bsm.dropna(subset=["BSM_BAG_CNT"])

    for _, row in sampled.iterrows():
        pax = bsm.loc[bsm["FLTSH_ID"] == row["FLTSH_ID"]]
        pax = pax[pax["BSM_BAG_CNT"].isin(BSM_BAG_COUNTS)]

        if pax.empty:
            continue

        # [bag0인 승객 수, ..., bag3인 승객 수] 형태의 길이 4짜리 배열
        current_counts = np.array(
            [(pax["BSM_BAG_CNT"] == k).sum() for k in BSM_BAG_COUNTS], dtype=float
        )
        n = int(current_counts.sum())
        prior_counts = compute_prior_counts(prior, n, PRIOR_PAX_RATIO)
        result.append((row["FLTSH_ID"], prior_counts, current_counts))

    return result


def run(output_dir: str, prior_folder: str, transaction_id: str) -> None:
    sampled_path = os.path.join(output_dir, "step2-flights-sampled.csv")
    bsm_path = os.path.join(output_dir, "step3-bsm.csv")

    if not os.path.exists(sampled_path):
        log(f"파일 없음: {sampled_path}", transaction_id)
        return
    if not os.path.exists(bsm_path):
        log(f"파일 없음: {bsm_path}", transaction_id)
        return

    sampled = pd.read_csv(sampled_path, dtype=str)
    bsm = pd.read_csv(bsm_path, dtype=str)
    prior = load_prior(prior_folder)

    log(f"[4단계 / BSM수하물분포] 산출 시작 / {len(sampled)}편 대상", transaction_id)

    entries = collect_bsm_counts(sampled, bsm, prior)
    posterior = aggregate_posterior_rate(entries)
    totals = {bag_cnt: int(sum(current_counts[i] for _, _, current_counts in entries)) for i, bag_cnt in enumerate(BSM_BAG_COUNTS)}

    note = " / ".join(f"BAG{bag_cnt}:{totals[bag_cnt]}" for bag_cnt in BSM_BAG_COUNTS)
    log(f"기여 운항편: {len(entries)}개({note})", transaction_id)

    records = [
        {
            "BSM_BAG_CNT": bag_cnt,
            "PRIOR": round(float(prior[i]), 4),
            "POSTERIOR": float(posterior[i]),
        }
        for i, bag_cnt in enumerate(BSM_BAG_COUNTS)
    ]

    output_path = os.path.join(output_dir, "step4-bsm-rate.csv")
    pd.DataFrame(records).to_csv(output_path, index=False, encoding="utf-8-sig")
    log(f"완료: {output_path}", transaction_id)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end",   required=True, help="수집 종료일 (YYYYMMDD)")
    parser.add_argument("--prior", required=True, help="사전확률 폴더명 (YYMMDD-YYMMDD)")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    output_dir = get_period_dir(args.start, args.end)
    run(output_dir, args.prior, transaction_id)


if __name__ == "__main__":
    main()
