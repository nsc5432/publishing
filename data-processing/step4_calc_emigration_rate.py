"""
4단계: 출국심사 유형별(내국인/외국인 x 자동/일반) 조건부 비율 산출
- 입력: step3-emigration-stats.csv (YM, KOR_TOTAL, KOR_AUTO, FOREIGN_TOTAL, FOREIGN_AUTO) — YM 오름차순 최대 2행
- CSV 마지막 행(최근월)을 현재 관측, 첫 번째 행(이전월)을 prior로 활용하여 베이지안 업데이트
- 출력: P(AUTO|KOR), P(MANUAL|KOR), P(AUTO|FOREIGN), P(MANUAL|FOREIGN) — 각 국적 내 합계=1.0
- 출력: data/{period}/step4-emigration-rate.csv
- 테스트 실행: python step4_calc_emigration_rate.py --start 20260212 --end 20260218
"""

import argparse
import os
import uuid

import numpy as np
import pandas as pd

from common import get_period_dir, log, round_and_normalize, compute_prior_counts, aggregate_posterior_rate, add_log_dir_arg, set_log_dir

PRIOR_PAX_RATIO = 0.9
EMIGRATION_MODES = ["AUTO", "MANUAL"]
NATIONALITIES = ["KOR", "FOREIGN"]
UNIFORM_MODE_PRIOR = np.array([0.857, 0.143])  # 자동:일반 = 6:1 기준 기본값


def bayesian_update(current_counts: np.ndarray, prior_dist: np.ndarray, n_ref: int, label: str, transaction_id: str) -> np.ndarray:
    prior_counts = compute_prior_counts(prior_dist, n_ref, PRIOR_PAX_RATIO)
    posterior = aggregate_posterior_rate([(label, prior_counts, current_counts)])
    return posterior


def run(output_dir: str, transaction_id: str) -> None:
    data_path = os.path.join(output_dir, "step3-emigration-stats.csv")
    if not os.path.exists(data_path):
        log(f"파일 없음: {data_path}", transaction_id)
        return

    df = pd.read_csv(data_path, dtype={"YM": str})
    for col in ["KOR_TOTAL", "KOR_AUTO", "FOREIGN_TOTAL", "FOREIGN_AUTO"]:
        df[col] = df[col].astype(int)

    if df.empty:
        log("[4단계 / 출국심사비율] 데이터 없음 — 종료", transaction_id)
        return

    current = df.iloc[-1]
    yyyymm = current["YM"]
    has_prior = len(df) >= 2

    if has_prior:
        prior_row_data = df.iloc[0]
        prev_yyyymm = prior_row_data["YM"]
        log(f"[4단계 / 출국심사비율] 산출 시작 / 현월: {yyyymm} / 전월: {prev_yyyymm}", transaction_id)
    else:
        log(f"[4단계 / 출국심사비율] 산출 시작 / 현월: {yyyymm} / 전월: 없음", transaction_id)
    log(f"사전확률 가상 승객 비율(PRIOR_PAX_RATIO): {PRIOR_PAX_RATIO:.2f}", transaction_id)

    records = []
    for nat in NATIONALITIES:
        total_col = "KOR_TOTAL" if nat == "KOR" else "FOREIGN_TOTAL"
        auto_col  = "KOR_AUTO"  if nat == "KOR" else "FOREIGN_AUTO"

        cur_auto   = int(current[auto_col])
        cur_total  = int(current[total_col])
        cur_manual = cur_total - cur_auto
        current_counts = np.array([cur_auto, cur_manual], dtype=float)

        if has_prior:
            prev_auto   = int(prior_row_data[auto_col])
            prev_total  = int(prior_row_data[total_col])
            prev_manual = prev_total - prev_auto
            prev_counts = np.array([prev_auto, prev_manual], dtype=float)
            prior_dist = round_and_normalize(prev_counts / prev_counts.sum())
        else:
            log(f"이전월 데이터 없음 — {nat} UNIFORM prior 사용", transaction_id)
            prior_dist = UNIFORM_MODE_PRIOR.copy()

        posterior = bayesian_update(current_counts, prior_dist, cur_total, nat, transaction_id)

        log(f"{nat}: AUTO {cur_auto:,} / MANUAL {cur_manual:,} (전체 {cur_total:,})", transaction_id)

        for i, mode in enumerate(EMIGRATION_MODES):
            records.append({
                "NATIONALITY":     nat,
                "EMIGRATION_MODE": mode,
                "PRIOR":           round(float(prior_dist[i]), 4),
                "POSTERIOR":       float(posterior[i]),
            })

    output_path = os.path.join(output_dir, "step4-emigration-rate.csv")
    pd.DataFrame(records).to_csv(output_path, index=False, encoding="utf-8-sig")
    log(f"완료: {output_path}", transaction_id)


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
