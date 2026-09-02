"""
4단계: 국적별(한국인/외국인) 비율 산출
- step2-flights-sampled.csv + step3-dg-passengers.csv 기반으로 기간별 국적 비율 산출
- 베이지안 업데이트로 사후확률 도출
- 사전확률: data/{prior_folder}/step4-nationality-rate.csv 의 POSTERIOR 컬럼
- 출력: data/{period}/step4-nationality-rate.csv
- 테스트 실행: python step4_calc_nationality_rate.py --start 20260212 --end 20260218 --prior 260205-260211
"""

import argparse
import os
import uuid

import numpy as np
import pandas as pd

from config import BASE_DIR
from common import get_period_dir, log, round_and_normalize, compute_prior_counts, aggregate_posterior_rate, add_log_dir_arg, set_log_dir

PRIOR_PAX_RATIO = 0.9
NATIONALITIES = ["KOR", "FOREIGN"]
UNIFORM_PRIOR = np.array([0.58, 0.42])  # 3단계 CAST 세팅 기본값 (KOR/FOREIGN 순서)


def load_prior(folder_name: str) -> np.ndarray:
    path = os.path.join(BASE_DIR, folder_name, "step4-nationality-rate.csv")
    if not os.path.exists(path):
        return UNIFORM_PRIOR.copy()
    df = pd.read_csv(path).set_index("NATIONALITY")["POSTERIOR"]
    return np.array([
        float(df["KOR"]),
        float(df["FOREIGN"]),
    ])


def collect_nationality_counts(
    sampled: pd.DataFrame,
    dg: pd.DataFrame,
    prior: np.ndarray,
) -> list[tuple[str, str, np.ndarray, np.ndarray]]:
    """
    운항편별 pseudo-count 쌍(prior_counts, current_counts) 수집.
    반환: [(FLTSH_ID, prior_counts[2], current_counts[2]), ...]
    """
    result: list[tuple[str, str, np.ndarray, np.ndarray]] = []

    for _, row in sampled.iterrows():
        pax = dg.loc[dg["FLTSH_ID"] == row["FLTSH_ID"]]

        if pax.empty:
            continue

        kor_count = int((pax["NTNLTY_CD"] == "KOR").sum())
        foreign_count = int((pax["NTNLTY_CD"] != "KOR").sum())
        n = kor_count + foreign_count
        prior_counts = compute_prior_counts(prior, n, PRIOR_PAX_RATIO)
        current_counts = np.array([kor_count, foreign_count], dtype=float)
        result.append((row["FLTSH_ID"], prior_counts, current_counts))

    return result


def run(output_dir: str, prior_folder: str, transaction_id: str) -> None:
    sampled_path = os.path.join(output_dir, "step2-flights-sampled.csv")
    dg_path = os.path.join(output_dir, "step3-dg-passengers.csv")

    if not os.path.exists(sampled_path):
        log(f"파일 없음: {sampled_path}", transaction_id)
        return
    if not os.path.exists(dg_path):
        log(f"파일 없음: {dg_path}", transaction_id)
        return

    sampled = pd.read_csv(sampled_path, dtype=str)
    dg = pd.read_csv(dg_path, dtype=str)

    prior = load_prior(prior_folder)

    log(f"[4단계 / 국적비율] 산출 시작 / {len(sampled)}편 대상", transaction_id)
    log(f"사전확률 가상 승객 비율(PRIOR_PAX_RATIO): {PRIOR_PAX_RATIO:.2f}", transaction_id)

    entries = collect_nationality_counts(sampled, dg, prior)
    count = len(entries)

    if count > 0:
        posterior = aggregate_posterior_rate(entries)
        total_kor = int(sum(current_counts[0] for _, _, current_counts in entries))
        total_foreign = int(sum(current_counts[1] for _, _, current_counts in entries))
        note = f" (KOR {total_kor} / FOREIGN {total_foreign})"
    else:
        posterior = round_and_normalize(prior.copy())
        note = " (관측 없음 / Prior 유지)"

    log(f"기여 운항편: {count}개{note}", transaction_id)

    records = []
    for i, nat in enumerate(NATIONALITIES):
        records.append({
            "NATIONALITY": nat,
            "PRIOR":       round(float(prior[i]), 4),
            "POSTERIOR":   float(posterior[i]),
        })

    output_path = os.path.join(output_dir, "step4-nationality-rate.csv")
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
