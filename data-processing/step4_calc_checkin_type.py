"""
4단계: 체크인유형(CK/SCI/MOBILE) 항공사별 비율 산출
- step2-flights-sampled.csv + step3-ck-passengers.csv 기반으로 항공사별 체크인 유형 비율 산출
- 사전확률: data/{prior_folder}/step4-checkin-type.csv 의 POSTERIOR 컬럼
- 출력: data/{period}/step4-checkin-type.csv
- 테스트 실행: python step4_calc_checkin_type.py --start 20260212 --end 20260218 --prior 260205-260211
"""

import argparse
import os
import uuid
import numpy as np
import pandas as pd
from config import BASE_DIR
from common import get_period_dir, log, compute_prior_counts, aggregate_posterior_rate, add_log_dir_arg, set_log_dir

PRIOR_PAX_RATIO = 0.9
CHECKIN_TYPES = ["CK", "SCI", "MOBILE"]
UNIFORM_PRIOR = np.array([0.7, 0.2, 0.1]) # 3단계 CAST 세팅 기본값 (CK/SCI/MOBILE 순서)


def load_prior_by_aln(folder_name: str) -> dict[str, np.ndarray]:
    """
    prior_folder/step4-checkin-type.csv 로드 → {ALN_CD: array[3]} 반환.
    파일 없거나 해당 항공사 row 없으면 UNIFORM_PRIOR fallback.
    """
    path = os.path.join(BASE_DIR, folder_name, "step4-checkin-type.csv")
    if not os.path.exists(path):
        return {}
    df = pd.read_csv(path)
    prior_map: dict[str, np.ndarray] = {}
    for aln_cd, grpDf in df.groupby("ALN_CD"):
        type_prior = grpDf.set_index("CHECKIN_TYPE")["POSTERIOR"]
        prior_map[str(aln_cd)] = np.array([
            float(type_prior.get("CK", UNIFORM_PRIOR[0])),
            float(type_prior.get("SCI", UNIFORM_PRIOR[1])),
            float(type_prior.get("MOBILE", UNIFORM_PRIOR[2])),
        ])
    return prior_map


def collect_entries(
    sampled: pd.DataFrame,
    ck_df: pd.DataFrame,
    prior_map: dict[str, np.ndarray],
) -> dict[str, list[tuple]]:
    """
    항공사별 (FLTSH_ID, prior_counts[3], current_counts[3]) 목록 반환.
    MOBILE = GD 탑승객수 - 체크인수 - 셀프체크인수
    """
    entries_by_aln: dict[str, list[tuple]] = {}
    ck_grouped = ck_df.groupby("FLTSH_ID")

    for _, row in sampled.iterrows():
        fltsh_id = row["FLTSH_ID"]
        aln_cd = str(row["DDLN_FLTNM"])[:2]
        n_ref = int(row["GD_BDPSG_CNT"])

        pax = ck_grouped.get_group(fltsh_id)
        ck_cnt = int((pax["CHKN_SE_CD"] == "CK").sum())
        sci_cnt = int((pax["CHKN_SE_CD"] == "SCI").sum())
        mobile_cnt = max(0, n_ref - ck_cnt - sci_cnt)

        prior = prior_map.get(aln_cd, UNIFORM_PRIOR)
        prior_counts = compute_prior_counts(prior, n_ref, PRIOR_PAX_RATIO)
        current_counts = np.array([ck_cnt, sci_cnt, mobile_cnt], dtype=float)

        entries_by_aln.setdefault(aln_cd, []).append((fltsh_id, prior_counts, current_counts))

    return entries_by_aln


def run(output_dir: str, prior_folder: str, transaction_id: str) -> None:
    sampled_path = os.path.join(output_dir, "step2-flights-sampled.csv")
    ck_path = os.path.join(output_dir, "step3-ck-passengers.csv")

    if not os.path.exists(sampled_path):
        log(f"파일 없음: {sampled_path}", transaction_id)
        return
    if not os.path.exists(ck_path):
        log(f"파일 없음: {ck_path}", transaction_id)
        return

    sampled = pd.read_csv(sampled_path, dtype=str)
    ck_df = pd.read_csv(ck_path, dtype=str)
    prior_map_by_aln = load_prior_by_aln(prior_folder)
    log(f"[4단계 / 체크인유형] 산출 시작 / {len(sampled)}편 대상", transaction_id)

    entries_by_aln = collect_entries(sampled, ck_df, prior_map_by_aln)

    records = []
    for aln_cd in sorted(entries_by_aln):
        entries = entries_by_aln[aln_cd]
        prior = prior_map_by_aln.get(aln_cd, UNIFORM_PRIOR)
        posterior = aggregate_posterior_rate(entries)
        for i, checkinType in enumerate(CHECKIN_TYPES):
            records.append({
                "ALN_CD": aln_cd,
                "CHECKIN_TYPE": checkinType,
                "PRIOR": round(float(prior[i]), 4),
                "POSTERIOR": float(posterior[i])
            })
        totals = {ct: int(sum(current_counts[i] for _, _, current_counts in entries)) for i, ct in enumerate(CHECKIN_TYPES)}

    output_path = os.path.join(output_dir, "step4-checkin-type.csv")
    pd.DataFrame(records).to_csv(output_path, index=False, encoding="utf-8-sig")
    log(f"완료: {output_path} ({len(entries_by_aln)}개 항공사)", transaction_id)


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
