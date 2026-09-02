"""파이프라인 전반에서 재사용되는 공통 유틸 함수."""

import argparse
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

import jaydebeapi
import numpy as np
import pandas as pd

from config import (
    BASE_DIR, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER,
    JDBC_DRIVER_CLASS, QUERIES_DIR,
)

# 경로는 CWD 가 아니라 이 파일 위치를 기준으로 잡는다.
MODULE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_DIR   = os.path.join(MODULE_DIR, "logs")   # --log-dir 로 덮어쓸 수 있다 (set_log_dir)
JDBC_JAR   = os.path.join(MODULE_DIR, "jar", "tibero6-jdbc.jar")
KST = timezone(timedelta(hours=9))  # 한국 표준시(UTC+9, DST 없음)


def set_log_dir(log_dir: Optional[str] = None) -> None:
    """로그 출력 폴더 지정. 미지정(None/빈 문자열)이면 기본값(스크립트 폴더의 logs/)을 유지한다.

    log() 가 호출 시점에 전역 LOGS_DIR 을 읽으므로, 진입점에서 한 번만 호출하면
    같은 프로세스 안의 모든 step 에 적용된다.
    """
    global LOGS_DIR
    if log_dir:
        LOGS_DIR = os.path.abspath(log_dir)


def add_log_dir_arg(parser: argparse.ArgumentParser) -> None:
    """진입점 argparse 에 --log-dir 옵션을 추가한다."""
    parser.add_argument("--log-dir", default=None,
                        help="로그 출력 폴더 (미지정 시 스크립트 폴더의 logs/)")


def log(msg: str, transaction_id: str) -> None:
    import sys
    now = datetime.now(KST)
    log_dir = os.path.join(LOGS_DIR, now.strftime("%Y"), now.strftime("%m"))
    os.makedirs(log_dir, exist_ok=True)
    log_line = f"[{transaction_id}] [{now.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    sys.stdout.buffer.write((log_line + "\n").encode("utf-8"))
    sys.stdout.buffer.flush()
    with open(os.path.join(log_dir, f"{now.strftime('%Y%m%d')}.log"), "a", encoding="utf-8") as f:
        f.write(log_line + "\n")


def get_connection():
    if not os.path.isfile(JDBC_JAR):
        raise FileNotFoundError(
            f"Tibero JDBC 드라이버가 없습니다: {JDBC_JAR}\n"
            "배포 시 해당 경로에 tibero6-jdbc.jar 를 배치하세요."
        )
    return jaydebeapi.connect(
        JDBC_DRIVER_CLASS,
        f"jdbc:tibero:thin:@{DB_HOST}:{DB_PORT}:{DB_NAME}",
        [DB_USER, DB_PASSWORD],
        JDBC_JAR,
    )


def get_period_dir(start_date: str, end_date: str) -> str:
    return os.path.join(BASE_DIR, f"{start_date[2:]}-{end_date[2:]}")


def load_sql_template(filename: str) -> str:
    path = os.path.join(QUERIES_DIR, filename)
    with open(path, encoding="utf-8") as f:
        return f.read()


def to_timestamp(ymd: str, hm: str) -> pd.Timestamp:
    return pd.Timestamp(datetime.strptime(ymd + hm, "%Y%m%d%H%M"))


def parse_passenger_datetime(df: pd.DataFrame) -> pd.DataFrame:
    """승객 DataFrame의 YMD+HM 컬럼을 DATETIME 컬럼으로 변환 (in-place)."""
    df["DATETIME"] = pd.to_datetime(df["YMD"] + df["HM"], format="%Y%m%d%H%M")
    return df


def calculate_posterior(
    prior: np.ndarray,
    likelihood: np.ndarray,
    observation_weight: float,
) -> np.ndarray:
    """베이지안 업데이트: posterior = prior * (1 - weight) + likelihood * weight"""
    if len(prior) != len(likelihood):
        raise ValueError("prior와 likelihood 배열 길이가 다릅니다.")
    return prior * (1.0 - observation_weight) + likelihood * observation_weight


def round_and_normalize(dist: np.ndarray, decimals: int = 4) -> np.ndarray:
    """소수점 4자리 반올림 후 합계가 정확히 1이 되도록 최댓값 bin에 오차 보정"""
    rounded = np.round(dist, decimals)
    error   = round(1.0 - float(np.round(rounded.sum(), decimals)), decimals)
    if error != 0.0:
        max_idx = int(np.argmax(rounded))
        rounded[max_idx] = round(float(rounded[max_idx]) + error, decimals)
    return rounded


def compute_bin_counts(
    std_dt: pd.Timestamp,
    passenger_times: pd.Series,
    bin_edges: list[int],
) -> np.ndarray:
    """출발예정시간 기준 승객 태깅시간의 bin별 승객수"""
    num_bins = len(bin_edges) - 1
    if passenger_times.empty:
        return np.zeros(num_bins)

    diffs = (std_dt - passenger_times).dt.total_seconds() / 60
    mask  = (diffs >= bin_edges[0]) & (diffs < bin_edges[-1])
    valid = diffs[mask]

    if valid.empty:
        return np.zeros(num_bins)

    # np.digitize: 각 값이 몇 번째 구간에 속하는지 반환
    bin_idx = np.digitize(valid.values, bin_edges) - 1
    return np.bincount(bin_idx, minlength=num_bins).astype(float)


def compute_prior_counts(prior: np.ndarray, n_ref: int, ratio: float) -> np.ndarray:
    """사전확률 분포를 가상 관측 인원수로 변환."""
    return prior * (n_ref * ratio)


def aggregate_posterior_rate(entries: list[tuple]) -> np.ndarray:
    """모든 운항편의 (prior_counts + current_counts) 합산 후 정규화."""
    pooled = sum(prior_counts + current_counts for _, prior_counts, current_counts in entries)
    return round_and_normalize(pooled / pooled.sum())
