"""
4단계: 시계열 분포 산출 (CK / DG / BG 공통 템플릿)
- 테스트 실행: python step4_calc_timeseries.py --start 20260212 --end 20260218 --prior 260205-260211
- 테스트 실행: python step4_calc_timeseries.py --start 20260212 --end 20260218 --prior 260205-260211 --debug-fltsh-id 9999021600000000106127
"""
import argparse
import os
import uuid
from dataclasses import dataclass
import numpy as np
import pandas as pd
from config import BASE_DIR
from common import (get_period_dir, parse_passenger_datetime, to_timestamp, log, compute_bin_counts, compute_prior_counts, aggregate_posterior_rate, add_log_dir_arg, set_log_dir)

BIN_EDGES = list(range(0, 310, 10)) # [0, 10, ..., 300] — 31개 경계 → 30 bins
BIN_LABELS = [f"-{(i + 1) * 10}분" for i in range(30)] # "-10분" ~ "-300분"
PRIOR_PAX_RATIO = 0.8   # 실 승객 N명당 사전확률에 할당할 가상 승객 비율 (N x ratio = 가상 승객 수)
PERIODS = ["P1", "P2", "P3", "P4", "P5"]
CK_MEASUREMENT_OFFSET_SEC = 466  # CK 태깅은 체크인 완료보다 466초 앞서 기록됨
GEN_SHIFT_SEC: dict[str, int] = {  # 피크/비피크별 발생시각 추정 추가 역방향 shift
    "P1": 900,   # 비피크: 15분
    "P2": 1800,  # 피크:   30분
    "P3": 1800,
    "P4": 1800,
    "P5": 900,   # 비피크: 15분
}

@dataclass
class FacilityConfig:
    code: str # "GEN", "CK", "DG", "BG"
    label: str
    shift_seconds: int = 0  # CK: 466(7분46초), BG: 0(0초), DG: 0(동적 shift)
    terminals: list[str] | None = None  # None → 터미널 분리 없음


FACILITIES = [
    FacilityConfig("GEN", "발생시각", terminals=["T1", "T2"]),
    FacilityConfig("CK","체크인카운터", shift_seconds=CK_MEASUREMENT_OFFSET_SEC, terminals=["T1", "T2"]),
    FacilityConfig("DG", "출국장", terminals=["T1", "T2"]),
    FacilityConfig("BG", "보딩게이트", shift_seconds=0),
]


def load_posterior_by_period(folder_name: str, filename: str, fallback_path: str | None = None) -> dict[str, np.ndarray]:
    path = os.path.join(BASE_DIR, folder_name, filename)
    if not os.path.exists(path):
        if fallback_path and os.path.exists(fallback_path):
            path = fallback_path
        else:
            raise FileNotFoundError(path)
    df = pd.read_csv(path)
    return {
        period: df.loc[df["PERIOD"] == period].sort_values("BIN_INDEX")["POSTERIOR"].to_numpy()
        for period in PERIODS
    } # {"P1": array[30], "P2": array[30], ..., "P5": array[30]}

def build_flight_transit_params(
    sampled: pd.DataFrame,
    ck_pax: pd.DataFrame,
    dg_pax: pd.DataFrame
) -> "dict[str, tuple[float, float] | None]":
    # 운항편(FLTSH_ID)별로 CK -> DG 이동시간의 IQR 필터(Q1 - (1.5xIQR) ~ Q3 + (1.5xIQR)) 적용 후 정규분포 파라미터(mean, std) 산출
    # 체크인카운터 ~ 출국장 사이의 이동에 대한 데이터는 대체로 평균대비 오른쪽 꼬리가 긴 형태의 데이터가 많기 때문에 IQR 방식으로 필터링이 적합하다
    flight_transits: dict[str, list[float]] = {}

    for _, row in sampled.iterrows():
        fltsh_id = row["FLTSH_ID"]

        ck_flight = ck_pax[ck_pax["FLTSH_ID"] == fltsh_id]
        dg_flight = dg_pax[dg_pax["FLTSH_ID"] == fltsh_id]

        if ck_flight.empty or dg_flight.empty:
            continue

        merged = ck_flight[["CHKN_SN", "DATETIME"]].merge(dg_flight[["CHKN_SN", "DATETIME"]], on="CHKN_SN", suffixes=("_ck", "_dg"))
        transit_min = (merged["DATETIME_dg"] - merged["DATETIME_ck"]).dt.total_seconds() / 60
        valid = transit_min[(transit_min > 0) & (transit_min < 300)]
        flight_transits.setdefault(fltsh_id, []).extend(valid.tolist())

    result: "dict[str, tuple[float, float] | None]" = {}
    for fltsh_id, transits in flight_transits.items():
        if not transits:
            result[fltsh_id] = None
            continue
        t_arr = np.array(transits)
        q1, q3 = np.percentile(t_arr, [25, 75])
        iqr = q3 - q1
        filtered = t_arr[(t_arr >= q1 - 1.5 * iqr) & (t_arr <= q3 + 1.5 * iqr)]
        if filtered.size == 0:
            filtered = t_arr
        mean = float(filtered.mean())
        std = max(float(filtered.std()), 1.0)
        result[fltsh_id] = (mean, std)
    return result


def synthesize_bin_counts_from_shift(
    std_dt: pd.Timestamp,
    source_pax: pd.DataFrame,
    transit_mean: float,
    transit_std: float
) -> np.ndarray:
    """source 시설 승객에 정규분포 이동시간 shift 적용 → 합성 도착 시간의 bin별 raw count."""
    rng = np.random.default_rng(42)
    n = len(source_pax)
    shifts = np.clip(rng.normal(transit_mean, transit_std, n), 0, 300)
    synthetic_dt = pd.to_datetime(source_pax["DATETIME"].values) + pd.to_timedelta(shifts, unit="m")
    return compute_bin_counts(std_dt, pd.Series(synthetic_dt), BIN_EDGES)



def collect_ck_bg_pseudocount_entries(
    sampled: pd.DataFrame,
    passengers: pd.DataFrame,
    priors: dict[str, np.ndarray],
) -> "dict[str, list[tuple[str, np.ndarray, np.ndarray]]]":
    """
    CK/BG 운항편별 pseudo-count 쌍(prior_counts, current_counts) 수집.
      - prior_counts  : prior_dist x (n_pax x PRIOR_PAX_RATIO) — 가상 관측 인원
      - current_counts: 승객 태깅시간의 bin별 raw counts
    반환: {period: [(FLTSH_ID, prior_counts[30], current_counts[30]), ...]}
    """
    result: "dict[str, list[tuple[str, np.ndarray, np.ndarray]]]" = {p: [] for p in PERIODS}

    for _, row in sampled.iterrows():
        period = row["P_TIME_SECTION"]
        fltsh_id = row["FLTSH_ID"]

        pax_times = passengers.loc[passengers["FLTSH_ID"] == fltsh_id, "DATETIME"]
        n_pax = len(pax_times)
        if n_pax == 0:
            continue

        std_dt = to_timestamp(row["GD_SE_YMD"], row["PREDC_HM"])
        prior_counts = compute_prior_counts(priors[period], n_pax, PRIOR_PAX_RATIO)
        current_counts = compute_bin_counts(std_dt, pax_times, BIN_EDGES)

        result[period].append((fltsh_id, prior_counts, current_counts))
    return result


def collect_gen_pseudocount_entries(
    sampled: pd.DataFrame,
    ck_pax: pd.DataFrame,
    priors: dict[str, np.ndarray],
) -> "dict[str, list[tuple[str, np.ndarray, np.ndarray]]]":
    """
    발생시각 pseudo-count 쌍 수집.
      - CK 보정 완료 승객 DATETIME에서 period별 GEN_SHIFT_SEC 추가 역방향 shift 적용
      - 반환: {period: [(FLTSH_ID, prior_counts[30], current_counts[30]), ...]}
    """
    result: "dict[str, list[tuple[str, np.ndarray, np.ndarray]]]" = {p: [] for p in PERIODS}

    for _, row in sampled.iterrows():
        period = row["P_TIME_SECTION"]
        fltsh_id = row["FLTSH_ID"]

        pax = ck_pax[ck_pax["FLTSH_ID"] == fltsh_id].copy()
        n_pax = len(pax)
        if n_pax == 0:
            continue

        shift = GEN_SHIFT_SEC[period]
        pax["DATETIME"] = pax["DATETIME"] - pd.Timedelta(seconds=shift)

        std_dt = to_timestamp(row["GD_SE_YMD"], row["PREDC_HM"])
        prior_counts = compute_prior_counts(priors[period], n_pax, PRIOR_PAX_RATIO)
        current_counts = compute_bin_counts(std_dt, pax["DATETIME"], BIN_EDGES)

        result[period].append((fltsh_id, prior_counts, current_counts))
    return result


def collect_dg_pseudocount_entries(
    sampled: pd.DataFrame,
    ck_pax: pd.DataFrame,
    dg_pax: pd.DataFrame,
    priors: dict[str, np.ndarray],
    debug_fltsh_id: str | None = None,
) -> "dict[str, list[tuple[str, np.ndarray, np.ndarray]]]":
    """
    운항편별 pseudo-count 쌍(prior_counts, current_counts) 수집.
      - prior_counts  : prior_dist x (n_ck x PRIOR_PAX_RATIO) — 가상 관측 인원
      - current_counts: CK 승객에 CK→DG 이동시간 shift 적용한 합성 DG 도착 bin counts
    반환: {period: [(FLTSH_ID, prior_counts[30], current_counts[30]), ...]}
    """
    flight_params = build_flight_transit_params(sampled, ck_pax, dg_pax)
    result: "dict[str, list[tuple[str, np.ndarray, np.ndarray]]]" = {p: [] for p in PERIODS}

    for _, row in sampled.iterrows():
        period = row["P_TIME_SECTION"]
        fltsh_id = row["FLTSH_ID"]

        ck_flight = ck_pax[ck_pax["FLTSH_ID"] == fltsh_id]
        n_ck = len(ck_flight)
        params = flight_params.get(fltsh_id)

        if n_ck == 0 or params is None:
            continue

        std_dt = to_timestamp(row["GD_SE_YMD"], row["PREDC_HM"])
        prior_counts = compute_prior_counts(priors[period], n_ck, PRIOR_PAX_RATIO)
        mean, std = params
        current_counts = synthesize_bin_counts_from_shift(std_dt, ck_flight, mean, std)

        if debug_fltsh_id and str(fltsh_id) == str(debug_fltsh_id):
            _print_shift_debug(fltsh_id, period, mean, std, ck_flight, dg_pax)

        result[period].append((fltsh_id, prior_counts, current_counts))
    return result


def _print_shift_debug(
    fltsh_id: str,
    period: str,
    transit_mean: float,
    transit_std: float,
    ck_flight: pd.DataFrame,
    dg_pax: pd.DataFrame,
) -> None:
    """CK → shift 적용 → 실제 DG 시간 비교 출력."""
    dg_flight = dg_pax[dg_pax["FLTSH_ID"] == fltsh_id].copy()

    rng = np.random.default_rng(42)
    n = len(ck_flight)
    shifts = np.clip(rng.normal(transit_mean, transit_std, n), 0, 300)

    debug_df = ck_flight[["CHKN_SN", "DATETIME"]].copy().reset_index(drop=True)
    debug_df.columns = ["CHKN_SN", "CK_TIME"]
    debug_df["SHIFT_MIN"] = shifts.round(1)
    debug_df["SYNTHETIC_DG"] = pd.to_datetime(debug_df["CK_TIME"]) + pd.to_timedelta(shifts, unit="m")

    if not dg_flight.empty and "CHKN_SN" in dg_flight.columns:
        actual = dg_flight[["CHKN_SN", "DATETIME"]].rename(columns={"DATETIME": "ACTUAL_DG"})
        debug_df = debug_df.merge(actual, on="CHKN_SN", how="left")
    else:
        debug_df["ACTUAL_DG"] = pd.NaT

    sep = "─" * 95
    print(f"\n{'═' * 95}")
    print(f"[SHIFT DEBUG] FLTSH_ID={fltsh_id}  Period={period}  transit mean={transit_mean:.1f}분  std={transit_std:.1f}분")
    print(sep)
    print(f"{'CHKN_SN':<14} {'CK_TIME':<22} {'SHIFT(분)':<10} {'SYNTHETIC_DG':<22} {'ACTUAL_DG':<22}")
    print(sep)
    for _, r in debug_df.iterrows():
        actual_str = r["ACTUAL_DG"].strftime("%Y-%m-%d %H:%M:%S") if pd.notna(r.get("ACTUAL_DG")) else "(없음)"
        print(
            f"{str(r['CHKN_SN']):<14} "
            f"{r['CK_TIME'].strftime('%Y-%m-%d %H:%M:%S'):<22} "
            f"{r['SHIFT_MIN']:>8.1f}  "
            f"{r['SYNTHETIC_DG'].strftime('%Y-%m-%d %H:%M:%S'):<22} "
            f"{actual_str:<22}"
        )
    print(f"{'═' * 95}\n")


def process_facility(
    facility: FacilityConfig,
    period_dir: str,
    sampled: pd.DataFrame,
    prior_folder: str,
    transaction_id: str,
    terminal: str | None = None,
    debug_fltsh_id: str | None = None,
) -> None:
    """시설물 하나의 Rate 산출 템플릿. CK / DG / BG 모두 이 함수로 처리."""
    log(f"사전확률 가상 승객 비율(PRIOR_PAX_RATIO): {PRIOR_PAX_RATIO:.2f}", transaction_id)
    code = facility.code.lower()
    terminal_suffix = f"-{terminal.lower()}" if terminal else ""
    prior_file = f"step4-{code}{terminal_suffix}-rate.csv"
    fallback_path = os.path.join(BASE_DIR, "init-data", prior_file)
    if not os.path.exists(os.path.join(BASE_DIR, prior_folder, prior_file)):
        log(f"[4단계 / {facility.label}({facility.code}){terminal_suffix}] 사전확률 파일 없음 → 초기 분포 사용: {fallback_path}", transaction_id)
    prior_by_period = load_posterior_by_period(prior_folder, prior_file, fallback_path=fallback_path)

    if facility.code == "DG":
        ck_path = os.path.join(period_dir, "step3-ck-passengers.csv")
        if not os.path.exists(ck_path):
            log(f"[4단계 / {facility.label}({facility.code}){terminal_suffix}] CK 파일 없음 - 스킵", transaction_id)
            return
        ck_passengers_raw = parse_passenger_datetime(pd.read_csv(ck_path, dtype=str))
        if terminal and "TMNL_ID" in ck_passengers_raw.columns:
            ck_passengers_raw = ck_passengers_raw[ck_passengers_raw["TMNL_ID"] == terminal]

        dg_path = os.path.join(period_dir, "step3-dg-passengers.csv")
        if not os.path.exists(dg_path):
            log(f"[4단계 / {facility.label}({facility.code}){terminal_suffix}] step3-dg-passengers.csv 없음 - 스킵", transaction_id)
            return
        dg_raw = parse_passenger_datetime(pd.read_csv(dg_path, dtype=str))
        prior_current_counts = collect_dg_pseudocount_entries(sampled, ck_passengers_raw, dg_raw, prior_by_period, debug_fltsh_id)
    elif facility.code == "GEN":
        ck_path = os.path.join(period_dir, "step3-ck-passengers.csv")
        if not os.path.exists(ck_path):
            log(f"[4단계 / {facility.label}(GEN){terminal_suffix}] CK 파일 없음 - 스킵", transaction_id)
            return
        ck_pax = parse_passenger_datetime(pd.read_csv(ck_path, dtype=str))
        if terminal and "TMNL_ID" in ck_pax.columns:
            ck_pax = ck_pax[ck_pax["TMNL_ID"] == terminal]
        ck_pax["DATETIME"] -= pd.Timedelta(seconds=CK_MEASUREMENT_OFFSET_SEC)
        prior_current_counts = collect_gen_pseudocount_entries(sampled, ck_pax, prior_by_period)
    else:  # CK / BG
        passengers_path = os.path.join(period_dir, f"step3-{code}-passengers.csv")
        if not os.path.exists(passengers_path):
            log(f"[4단계 / {facility.label}({facility.code}){terminal_suffix}] step3 파일 없음 - 스킵: {passengers_path}", transaction_id)
            return
        passengers = parse_passenger_datetime(pd.read_csv(passengers_path, dtype=str))
        if terminal and "TMNL_ID" in passengers.columns:
            passengers = passengers[passengers["TMNL_ID"] == terminal]
        if facility.shift_seconds:
            passengers["DATETIME"] -= pd.Timedelta(seconds=facility.shift_seconds)
        prior_current_counts = collect_ck_bg_pseudocount_entries(sampled, passengers, prior_by_period)

    log(f"[4단계 / {facility.label}({facility.code}){terminal_suffix}] Rate 산출 시작 / {len(sampled)}편 대상", transaction_id)
    records = []
    for period in PERIODS:
        prior = prior_by_period[period]
        entries = prior_current_counts[period]
        posterior_rate = aggregate_posterior_rate(entries) if entries else prior
        log(f"[{period}] 기여 운항편: {len(entries)}개", transaction_id)
        for i, label in enumerate(BIN_LABELS):
            records.append({
                "PERIOD":    period,
                "BIN_INDEX": i,
                "BIN_LABEL": label,
                "PRIOR":     round(float(prior[i]), 4),
                "POSTERIOR": float(posterior_rate[i]),
            })

    output_path = os.path.join(period_dir, f"step4-{code}{terminal_suffix}-rate.csv")
    pd.DataFrame(records).to_csv(output_path, index=False, encoding="utf-8-sig")
    log(f"완료: {output_path}", transaction_id)


def run(output_dir: str, prior_folder: str, transaction_id: str, debug_fltsh_id: str | None = None) -> None:
    sampled = pd.read_csv(os.path.join(output_dir, "step2-flights-sampled.csv"), dtype=str)

    for facility in FACILITIES:
        if facility.terminals:
            for terminal in facility.terminals:
                process_facility(facility, output_dir, sampled, prior_folder, transaction_id, terminal, debug_fltsh_id)
        else:
            process_facility(facility, output_dir, sampled, prior_folder, transaction_id, debug_fltsh_id=debug_fltsh_id)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", required=True, help="수집 시작일 (YYYYMMDD)")
    parser.add_argument("--end", required=True, help="수집 종료일 (YYYYMMDD)")
    parser.add_argument("--prior", required=True, help="사전확률 폴더명 (YYMMDD-YYMMDD)")
    parser.add_argument("--debug-fltsh-id", default=None, help="shift 디버그 출력할 FLTSH_ID")
    add_log_dir_arg(parser)
    args = parser.parse_args()
    set_log_dir(args.log_dir)

    transaction_id = str(uuid.uuid4())[:8]
    output_dir = get_period_dir(args.start, args.end)
    run(output_dir, args.prior, transaction_id, args.debug_fltsh_id)

if __name__ == "__main__":
    main()
