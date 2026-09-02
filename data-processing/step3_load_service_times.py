"""
3단계: 시설물별 서비스시간 샘플링
[IDEA]: 공항이 붐빈 시간대에 각 시설물에 대한 동일 채널(큐)에서 연속으로 처리된 두 승객 사이의 시간 차이(diff)를 서비스시간으로 유추한다.
- 테스트 실행: python step3_load_service_times.py --start 20260212 --end 20260218
"""

import argparse
import os
import uuid
import pandas as pd
from common import get_period_dir, parse_passenger_datetime, log, add_log_dir_arg, set_log_dir


# 하루 144개(=24h × 6) 10분 슬롯 중 승객 밀집도 상위 5개만 사용
PEAKS_PER_DAY = 5
UPPER_SEC = 600.0

SEGMENTS = {
    "CK_CK": {"facility": "ck", "filter_col": "CHKN_SE_CD", "filter_val": "CK", "queue_col": "CHKN_ISTR_NO", "use_aln": True, "lower_sec": 120.0},
    "CK_SCI": {"facility": "ck", "filter_col": "CHKN_SE_CD", "filter_val": "SCI", "queue_col": "CHKN_ISTR_NO", "use_aln": False, "lower_sec": 0.0},
    "DG_RC01": {"facility": "dg", "filter_col": "DPTGT_ETRY_CD", "filter_val": "RC01", "queue_col": "TRNST_ISTR_ID", "use_aln": False, "lower_sec": 0.0},
    "DG_RC02": {"facility": "dg", "filter_col": "DPTGT_ETRY_CD", "filter_val": "RC02", "queue_col": "TRNST_ISTR_ID", "use_aln": False, "lower_sec": 0.0},
    "BG": {"facility": "bg", "filter_col": None, "filter_val": None, "queue_col": "DDLN_FLTNM", "use_aln": False, "lower_sec": 0.0},
}

def load_facility_df(output_dir: str, facility: str) -> pd.DataFrame:
    path = os.path.join(output_dir, f"step3-{facility}-passengers.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"파일 없음: {path}")
    df = pd.read_csv(path, dtype=str)
    return parse_passenger_datetime(df)

def compute_all_service_times(seg_df: pd.DataFrame, queue_col: str, use_aln: bool, lower_sec: float) -> pd.DataFrame:
    records = []
    for (ymd, time_bin, queue), grp in seg_df.groupby(["YMD", "TIME_BIN", queue_col]):
        grp = grp.sort_values("DATETIME")
        # 연속 diff를 구하려면 최소 2명 필요
        if len(grp) < 2:
            continue

        diffs_sec = grp["DATETIME"].diff().dt.total_seconds().iloc[1:] # diff() 의 첫번째 요소(NaN)는 제거

        # diff는 i-1 → i 의 간격이므로 i번째 행의 ALN_CD를 사용
        aln_codes = (grp["ALN_CD"].iloc[1:].values if use_aln else ["ALL"] * len(diffs_sec))

        for diff_sec, aln in zip(diffs_sec.values, aln_codes):
            if lower_sec < diff_sec <= UPPER_SEC:
                records.append({
                    "YMD": ymd,
                    "TIME_BIN": time_bin,
                    "TIME_BIN_START": pd.Timestamp(time_bin).strftime("%H%M"),
                    "QUEUE": str(queue),
                    "ALN_CD": str(aln),
                    "SERVICE_TIME_SEC": round(float(diff_sec), 1),
                })

    if not records:
        return pd.DataFrame(columns=["YMD", "TIME_BIN", "TIME_BIN_START", "QUEUE", "ALN_CD", "SERVICE_TIME_SEC"])
    return pd.DataFrame(records)


def detect_peak_time_bins(svc_times: pd.DataFrame) -> pd.DataFrame:
    counts = svc_times.groupby(["YMD", "TIME_BIN"]).size().reset_index(name="CNT")

    return (
        counts
        .sort_values("CNT", ascending=False)
        .groupby("YMD") # 날짜별로 묶으면 CNT 가 많은순의 TIME_BIN 이 선택된다
        .head(PEAKS_PER_DAY)
        [["YMD", "TIME_BIN"]]
        .reset_index(drop=True)
    )


def run(output_dir: str, transaction_id: str) -> None:
    facility_dfs = {}
    for facility in ("ck", "dg", "bg"):
        try:
            facility_dfs[facility] = load_facility_df(output_dir, facility)
        except FileNotFoundError as e:
            log(str(e), transaction_id)
            return

    ck_df = facility_dfs["ck"]
    dg_df = facility_dfs["dg"]
    bg_df = facility_dfs["bg"]

    ck_df["ALN_CD"] = ck_df["DDLN_FLTNM"].str[:2]

    for df in (ck_df, dg_df, bg_df):
        df["TIME_BIN"] = df["DATETIME"].dt.floor("10min")

    all_records = []
    for seg_name, config in SEGMENTS.items():
        base_df = {"ck": ck_df, "dg": dg_df, "bg": bg_df}[config["facility"]]

        if config["filter_col"]:
            seg_df = base_df[base_df[config["filter_col"]] == config["filter_val"]].copy()
        else:
            seg_df = base_df.copy()

        if seg_df.empty:
            log(f"[{seg_name}] 데이터 없음", transaction_id)
            continue

        svc_times = compute_all_service_times(seg_df, config["queue_col"], config["use_aln"], config["lower_sec"])

        if svc_times.empty:
            log(f"[{seg_name}] 유효 서비스시간 없음", transaction_id)
            continue

        peak_time_bins = detect_peak_time_bins(svc_times)
        log(f"[{seg_name}] 피크 TIME_BIN {len(peak_time_bins)}개 탐지", transaction_id)

        in_peak = svc_times.merge(peak_time_bins, on=["YMD", "TIME_BIN"])
        records = in_peak.drop(columns=["TIME_BIN"]).to_dict("records")

        for r in records:
            r["SEGMENT"] = seg_name
        all_records.extend(records)
        log(f"[{seg_name}] 서비스시간 {len(records)}건 수집", transaction_id)

    if not all_records:
        log("수집된 서비스시간 데이터가 없습니다.", transaction_id)
        return

    result_df = pd.DataFrame(
        all_records,
        columns=["SEGMENT", "YMD", "TIME_BIN_START", "QUEUE", "ALN_CD", "SERVICE_TIME_SEC"]
    )

    out_path = os.path.join(output_dir, "step3-service-times.csv")
    result_df.to_csv(out_path, index=False, encoding="utf-8-sig")
    log(f"완료 - 총 {len(result_df)}건 저장 → {out_path}", transaction_id)

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
