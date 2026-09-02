"""
4단계: 서비스시간 분포 구하기
- step3-service-times.csv 기반으로 시설물·방식·항공사별 최적 분포 산출
- 후보 11종 분포 (AIC 최솟값 채택):
  Constant   : PARAM1-고정값
  Random     : PARAM1-최솟값, PARAM2-최댓값
  Triangular : PARAM1-최솟값, PARAM2-최빈값, PARAM3-최댓값
  Gamma      : PARAM1-형태(α), PARAM2-스케일(β)
  Gaussian   : PARAM1-평균, PARAM2-표준편차
  Exponential: PARAM1-스케일(=평균)
  Erlang     : PARAM1-형태k(정수), PARAM2-스케일
  Weibull    : PARAM1-형태(c), PARAM2-스케일
  Polygonal  : PARAM1-빈수, PARAM2-최솟값, PARAM3-최댓값
  Poisson    : PARAM1-mu(λ)  ※이산분포·정수 반올림
  NegBinom   : PARAM1-n, PARAM2-p  ※이산분포·정수 반올림
- 출력: data/{period}/step4-service-dist.csv
- 실행: python step4_calc_service_times.py --start 20260219 --end 20260225
"""
import argparse
import os
import uuid
import numpy as np
import pandas as pd
from scipy import stats
from common import get_period_dir, log, add_log_dir_arg, set_log_dir

MIN_SAMPLES = 5
CONSTANT_EPSILON = 0.1 # Constant 분포 우도 계산용 최소 표준편차(초) — 측정 해상도 하한
ERLANG_K_MAX = 30
SEGMENT_BY_ALN = ("CK_CK") # 체크인카운터-체크인
SEGMENT_ALL = ("CK_SCI", "DG_RC01", "DG_RC02", "BG") # 체크인카운터-셀프체크인, 출국-일반, 출국-안면인식, 보딩게이트


def _aic(log_ll: float, n_params: int) -> float:
    return 2 * n_params - 2 * log_ll


def _fit_constant(data: np.ndarray) -> dict:
    loc = float(np.mean(data))
    scale = max(float(np.std(data)), CONSTANT_EPSILON)
    log_ll = float(stats.norm.logpdf(data, loc=loc, scale=scale).sum())
    return {"DIST_NAME": "Constant", "PARAM1": round(loc, 3), "PARAM2": None, "PARAM3": None, "AIC": round(_aic(log_ll, 1), 2)}


def _fit_random(data: np.ndarray) -> dict:
    # loc: 최솟값, scale: 구간 길이 (최댓값 - 최솟값)
    loc, scale = stats.uniform.fit(data)
    log_ll = float(stats.uniform.logpdf(data, loc=loc, scale=scale).sum())
    return {"DIST_NAME": "Random", "PARAM1": round(loc, 3), "PARAM2": round(loc + scale, 3), "PARAM3": None, "AIC": round(_aic(log_ll, 2), 2)}


def _fit_triangular(data: np.ndarray) -> dict:
    # c: 최빈값의 상대위치(0~1), loc: 최솟값, scale: 범위(최댓값 - 최솟값)
    c, loc, scale = stats.triang.fit(data)
    log_ll = float(stats.triang.logpdf(data, c, loc=loc, scale=scale).sum())
    mode = round(loc + c * scale, 3)
    return {"DIST_NAME": "Triangular", "PARAM1": round(loc, 3), "PARAM2": mode, "PARAM3": round(loc + scale, 3), "AIC": round(_aic(log_ll, 3), 2)}


def _fit_gamma(data: np.ndarray) -> dict:
    # a: 분포의 형태 결정. 작으면 오른쪽으로 치우침, 커질수록 정규분포에 가까워짐
    # loc: 분포의 시작점(이동). floc=0 으로 고정했으므로 항상 0
    # scale: 분포의 퍼짐 정도. 클수록 분포가 넓고 평균이 커짐
    a, loc, scale = stats.gamma.fit(data, floc=0) # floc=0 고정: 서비스시간은 0 이상이므로
    log_ll = float(stats.gamma.logpdf(data, a, loc=loc, scale=scale).sum())
    return {"DIST_NAME": "Gamma", "PARAM1": round(a, 3), "PARAM2": round(scale, 3), "PARAM3": None, "AIC": round(_aic(log_ll, 2), 2)}


def _fit_gaussian(data: np.ndarray) -> dict:
    loc, scale = stats.norm.fit(data)
    log_ll = float(stats.norm.logpdf(data, loc=loc, scale=scale).sum())
    return {"DIST_NAME": "Gaussian", "PARAM1": round(loc, 3), "PARAM2": round(scale, 3), "PARAM3": None, "AIC": round(_aic(log_ll, 2), 2)}


def _fit_exponential(data: np.ndarray) -> dict:
    loc, scale = stats.expon.fit(data, floc=0)
    log_ll = float(stats.expon.logpdf(data, loc=loc, scale=scale).sum())
    return {"DIST_NAME": "Exponential", "PARAM1": round(scale, 3), "PARAM2": None, "PARAM3": None, "AIC": round(_aic(log_ll, 1), 2)}


def _fit_erlang(data: np.ndarray) -> dict:
    best_k, best_ll, best_scale = 1, -np.inf, 1.0
    for k in range(1, ERLANG_K_MAX + 1):
        try:
            a, loc, scale = stats.erlang.fit(data, f0=k, floc=0)
            ll = float(stats.erlang.logpdf(data, a, loc=loc, scale=scale).sum())
            if ll > best_ll:
                best_ll, best_k, best_scale = ll, k, scale
        except Exception:
            pass
    return {"DIST_NAME": "Erlang", "PARAM1": best_k, "PARAM2": round(best_scale, 3), "PARAM3": None, "AIC": round(_aic(best_ll, 2), 2)}


def _fit_weibull(data: np.ndarray) -> dict:
    c, loc, scale = stats.weibull_min.fit(data, floc=0)
    log_ll = float(stats.weibull_min.logpdf(data, c, loc=loc, scale=scale).sum())
    return {"DIST_NAME": "Weibull", "PARAM1": round(c, 3), "PARAM2": round(scale, 3), "PARAM3": None, "AIC": round(_aic(log_ll, 2), 2)}


def _fit_polygonal(data: np.ndarray) -> dict:
    n_bins = max(5, min(int(np.sqrt(len(data))), 30))
    counts, bin_edges = np.histogram(data, bins=n_bins)
    # rv_histogram은 bin 내 밀도를 상수로 취급하는 연속 분포를 생성
    rv = stats.rv_histogram((counts, bin_edges))
    eps = 1e-300
    pdf_vals = np.clip(rv.pdf(data), eps, None)
    log_ll = float(np.log(pdf_vals).sum())
    return {
        "DIST_NAME": "Polygonal",
        "PARAM1": n_bins,
        "PARAM2": round(float(bin_edges[0]), 3),
        "PARAM3": round(float(bin_edges[-1]), 3),
        "AIC": round(_aic(log_ll, n_bins), 2),
    }


def _fit_poisson(data: np.ndarray) -> dict:
    # Poisson은 이산 분포 — 서비스시간을 정수 반올림 후 PMF 로그우도 계산
    data_int = np.round(data).astype(int)
    mu = float(data_int.mean())
    log_ll = float(stats.poisson.logpmf(data_int, mu).sum())
    return {"DIST_NAME": "Poisson", "PARAM1": round(mu, 3), "PARAM2": None, "PARAM3": None, "AIC": round(_aic(log_ll, 1), 2)}


def _fit_nbinom(data: np.ndarray) -> dict:
    # Negative Binomial은 이산 분포 — 모멘트 매칭으로 n, p 추정
    data_int = np.round(data).astype(int)
    mu = float(data_int.mean())
    var = float(data_int.var())
    if var <= mu:
        raise ValueError("분산 <= 평균: Negative Binomial 적합 불가")
    p = mu / var
    n = mu * p / (1 - p)
    log_ll = float(stats.nbinom.logpmf(data_int, n, p).sum())
    return {"DIST_NAME": "NegBinom", "PARAM1": round(n, 3), "PARAM2": round(p, 6), "PARAM3": None, "AIC": round(_aic(log_ll, 2), 2)}


def best_fit(data: np.ndarray) -> dict:
    """후보 11종 분포(Constant / Random / Triangular / Gamma / Gaussian / Exponential / Erlang / Weibull / Polygonal / Poisson / NegBinom) 중 AIC 최솟값 분포를 반환."""
    candidates = []
    for fitter in (_fit_constant, _fit_random, _fit_triangular, _fit_gamma,
                   _fit_gaussian, _fit_exponential, _fit_erlang,
                   _fit_weibull, _fit_polygonal, _fit_poisson, _fit_nbinom):
        try:
            candidates.append(fitter(data))
        except Exception:
            pass

    if not candidates:
        return _fit_constant(data)

    return min(candidates, key=lambda x: x["AIC"])


def fit_segment(df: pd.DataFrame, seg: str, aln_cd: str, transaction_id: str) -> dict | None:
    data = df["SERVICE_TIME_SEC"].values.astype(float)
    if len(data) < MIN_SAMPLES:
        log(f"[{seg}/{aln_cd}] 샘플 부족({len(data)}건) - 건너뜀", transaction_id)
        return None

    fit = best_fit(data)
    log(f"[{seg}/{aln_cd}] {fit['DIST_NAME']} (AIC={fit['AIC']}, n={len(data)})", transaction_id)
    return {
        "SEGMENT": seg,
        "ALN_CD": aln_cd,
        "N_SAMPLES": len(data),
        "DIST_NAME": fit["DIST_NAME"],
        "PARAM1": fit["PARAM1"],
        "PARAM2": fit["PARAM2"],
        "PARAM3": fit["PARAM3"],
        "AIC": fit["AIC"],
    }


def run(output_dir: str, transaction_id: str) -> None:
    in_path = os.path.join(output_dir, "step3-service-times.csv")
    if not os.path.exists(in_path):
        log(f"파일 없음: {in_path}", transaction_id)
        return

    df = pd.read_csv(in_path, dtype=str)

    results = []

    for seg in SEGMENT_BY_ALN:
        for aln_cd, grp in df[df["SEGMENT"] == seg].groupby("ALN_CD"):
            row = fit_segment(grp, seg, str(aln_cd), transaction_id)
            if row:
                results.append(row)

    for seg in SEGMENT_ALL:
        grp = df[df["SEGMENT"] == seg]
        row = fit_segment(grp, seg, "ALL", transaction_id)
        if row:
            results.append(row)

    if not results:
        log("fitting 결과가 없습니다.", transaction_id)
        return

    out_df = pd.DataFrame(
        results,
        columns=["SEGMENT", "ALN_CD", "DIST_NAME", "PARAM1", "PARAM2", "PARAM3", "N_SAMPLES", "AIC"],
    )
    out_path = os.path.join(output_dir, "step4-service-dist.csv")
    out_df.to_csv(out_path, index=False, encoding="utf-8-sig")
    log(f"완료 - {len(out_df)}건 저장 → {out_path}", transaction_id)


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
