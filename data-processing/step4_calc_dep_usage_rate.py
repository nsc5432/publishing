"""
4단계: 체크인 아일랜드별 출국장 진입 비율 산출
- CK 승객(아일랜드)과 DG 승객(출국장)을 CHKN_SN 기준으로 조인
- 전체 수집 기간 통합, 터미널별 필터링
- 베이지안 업데이트로 사후확률 도출
- 사전확률: data/{prior_folder}/step4-dep-usage-rate.csv 우선, 없으면 data/init-data/step4-dep-usage-rate.csv
- 출력: data/{period}/step4-dep-usage-rate.csv
  컬럼: TMNL_ID, CHECKED_ISLAND, DG_1, DG_2, ..., DG_N (비율 합=1.0)
- 테스트 실행: python step4_calc_dep_usage_rate.py --start 20260212 --end 20260218 --prior 260205-260211
"""

import argparse
import os
import uuid

import numpy as np
import pandas as pd

from common import (
    get_period_dir, log, round_and_normalize,
    compute_prior_counts, aggregate_posterior_rate,
    add_log_dir_arg, set_log_dir,
)
from config import BASE_DIR

PRIOR_PAX_RATIO = 0.9
VALID_CHECKED_ISLANDS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N"]
CITY_AIRPORT_ISLAND = "Z"
CITY_AIRPORT_ISTR_IDS = ("CKS", "LFB")
INIT_DATA_PATH = os.path.join(BASE_DIR, "init-data", "step4-dep-usage-rate.csv")


def load_and_filter(output_dir: str, transaction_id: str) -> pd.DataFrame:
    path = os.path.join(output_dir, "step3-ck-dg-bg-passengers.csv")
    if not os.path.exists(path):
        log(f"파일 없음: {path}", transaction_id)
        raise FileNotFoundError(path)

    df = pd.read_csv(path, dtype=str)
    log(f"통합 승객 로드: {len(df)}건", transaction_id)

    before = len(df)
    df = df.dropna(subset=["TMNL_ID", "DG_DG_NUMBER"])
    df = df[df["DG_DG_NUMBER"].str.strip() != ""]
    log(f"DG 유효 행: {len(df)}건 (제거 {before - len(df)}건)", transaction_id)

    # 도심공항 승객: CHKN_ISTR_NO에 CKS 또는 LFB 포함 → ISLAND = "Z"
    istr_id = df["CK_CHKN_ISTR_NO"].fillna("")
    is_city = istr_id.str.contains("|".join(CITY_AIRPORT_ISTR_IDS), na=False)

    city = df[is_city].copy()
    city["CHECKED_ISLAND"] = CITY_AIRPORT_ISLAND
    city = city.rename(columns={"DG_DG_NUMBER": "DG_NUMBER"})
    city = city[["CHKN_SN", "FLTSH_ID", "TMNL_ID", "CHECKED_ISLAND", "DG_NUMBER"]]

    general = df[~is_city].copy()
    general = general.dropna(subset=["CK_CHECKED_ISLAND"])
    general = general[general["CK_CHECKED_ISLAND"].str.strip() != ""]
    general = general[general["CK_CHECKED_ISLAND"].isin(VALID_CHECKED_ISLANDS)].copy()
    general = general.rename(columns={"CK_CHECKED_ISLAND": "CHECKED_ISLAND", "DG_DG_NUMBER": "DG_NUMBER"})
    general = general[["CHKN_SN", "FLTSH_ID", "TMNL_ID", "CHECKED_ISLAND", "DG_NUMBER"]]

    log(f"일반 승객: {len(general)}건, 도심공항(Z) 승객: {len(city)}건", transaction_id)

    result = pd.concat([general, city], ignore_index=True)
    result["DG_NUMBER"] = result["DG_NUMBER"].str.strip()
    return result


def load_prior(prior_folder: str, transaction_id: str) -> pd.DataFrame:
    path = os.path.join(BASE_DIR, prior_folder, "step4-dep-usage-rate.csv")
    if os.path.exists(path):
        log(f"사전확률 로드: {path}", transaction_id)
        df = pd.read_csv(path, dtype=str)
    else:
        log(f"사전확률 없음, 초기 분포 사용: {INIT_DATA_PATH}", transaction_id)
        df = pd.read_csv(INIT_DATA_PATH, dtype=str)
    dg_cols = sorted(
        [c for c in df.columns if c.startswith("DG_")],
        key=lambda x: int(x.split("_")[1]),
    )
    for col in dg_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)
    return df[["TMNL_ID", "CHECKED_ISLAND"] + dg_cols]


def build_prior_map(prior_df: pd.DataFrame, dg_cols: list[str]) -> dict:
    result = {}
    for _, row in prior_df.iterrows():
        key = (row["TMNL_ID"], row["CHECKED_ISLAND"])
        result[key] = np.array([float(row.get(col, 0.0)) for col in dg_cols], dtype=float)
    return result


def collect_entries(
    merged: pd.DataFrame,
    prior_map: dict,
    dg_cols: list[str],
) -> dict:
    """
    (TMNL_ID, CHECKED_ISLAND) 그룹별 (prior_counts, current_counts) 수집.
    반환: {(TMNL_ID, CHECKED_ISLAND): [(key, prior_counts, current_counts)]}
    """
    dg_nums = [int(c.split("_")[1]) for c in dg_cols]
    n_dg = len(dg_cols)
    entries = {}

    for (tmnl_id, island), group in merged.groupby(["TMNL_ID", "CHECKED_ISLAND"]):
        key = (tmnl_id, island)
        counts = group["DG_NUMBER"].value_counts()
        current_counts = np.array(
            [float(counts.get(str(n), 0)) for n in dg_nums], dtype=float
        )
        n = int(current_counts.sum())
        prior = prior_map.get(key, round_and_normalize(np.ones(n_dg)))
        prior_counts = compute_prior_counts(prior, n, PRIOR_PAX_RATIO)
        entries[key] = [(str(key), prior_counts, current_counts)]

    return entries


def run(output_dir: str, prior_folder: str, transaction_id: str) -> None:
    log("[4단계] 아일랜드별 출국장 진입 비율 산출 시작", transaction_id)
    log(f"사전확률 가상 승객 비율(PRIOR_PAX_RATIO): {PRIOR_PAX_RATIO:.2f}", transaction_id)

    merged = load_and_filter(output_dir, transaction_id)

    prior_df = load_prior(prior_folder, transaction_id)
    prior_dg_cols = sorted(
        [c for c in prior_df.columns if c.startswith("DG_")],
        key=lambda x: int(x.split("_")[1]),
    )

    if not merged.empty:
        obs_dg_nums = sorted(
            pd.to_numeric(merged["DG_NUMBER"], errors="coerce").dropna().unique().astype(int)
        )
        obs_dg_cols = [f"DG_{n}" for n in obs_dg_nums]
        all_dg_nums = sorted(
            set(int(c.split("_")[1]) for c in prior_dg_cols) | set(obs_dg_nums)
        )
    else:
        all_dg_nums = [int(c.split("_")[1]) for c in prior_dg_cols]

    all_dg_cols = [f"DG_{n}" for n in all_dg_nums]

    for col in all_dg_cols:
        if col not in prior_df.columns:
            prior_df[col] = 0.0

    prior_map = build_prior_map(prior_df, all_dg_cols)

    records = []

    if not merged.empty:
        entries_map = collect_entries(merged, prior_map, all_dg_cols)

        for (tmnl_id, island), group_entries in entries_map.items():
            posterior = aggregate_posterior_rate(group_entries)
            records.append({
                "TMNL_ID": tmnl_id,
                "CHECKED_ISLAND": island,
                **{col: float(posterior[i]) for i, col in enumerate(all_dg_cols)},
            })

        log(f"베이지안 산출 완료: {len(entries_map)}개 (TMNL_ID x CHECKED_ISLAND) 조합", transaction_id)
    else:
        entries_map = {}
        log("매칭된 승객이 없습니다. 사전확률을 사후확률로 사용합니다.", transaction_id)

    # Prior에만 있는 그룹 (관측 없음): prior를 posterior로 사용
    no_obs = 0
    for key, prior_arr in prior_map.items():
        if key not in entries_map:
            posterior = round_and_normalize(prior_arr.copy())
            records.append({
                "TMNL_ID": key[0],
                "CHECKED_ISLAND": key[1],
                **{col: float(posterior[i]) for i, col in enumerate(all_dg_cols)},
            })
            no_obs += 1
    if no_obs > 0:
        log(f"관측 없는 그룹 (Prior 유지): {no_obs}개", transaction_id)

    if not records:
        log("출력할 데이터가 없습니다.", transaction_id)
        return

    result_df = (
        pd.DataFrame(records)
        .sort_values(["TMNL_ID", "CHECKED_ISLAND"])
        .reset_index(drop=True)
    )
    result_df = result_df[["TMNL_ID", "CHECKED_ISLAND"] + all_dg_cols]

    out_path = os.path.join(output_dir, "step4-dep-usage-rate.csv")
    result_df.to_csv(out_path, index=False, encoding="utf-8-sig")
    log(f"완료 - 저장 위치: {out_path}", transaction_id)


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
