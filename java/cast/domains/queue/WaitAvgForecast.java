package aoms.pm.cast.domains.queue;

import java.util.ArrayDeque;
import java.util.Objects;

/**
 * 시설 수 s 를 평가시각 t 부터 적용했을 때 미래 시각 u 의 직전 30분 [u-30분, u) 처리 여객 평균 대기시간을 예측한다.
 * 창의 t 이전 부분은 실제 처리 이력, t 이후 부분은 1분 단위 유체 FIFO 예측이다.
 * 남은 대기자의 대기시간은 t 에서 0 으로 되돌리지 않고, 이미 처리된 여객의 대기시간은 시설 수와 무관하다.
 */
public final class WaitAvgForecast {
    /** 해소 시각을 찾는 최대 예측 범위 (분). 넘으면 산정 불가 */
    public static final int MAX_HORIZON_MIN = 24 * 60;

    private static final int WINDOW_MIN = QueueWaitWindow.WINDOW_MIN;
    private static final int SEARCH_LIMIT = 100_000;
    private static final double SEC_PER_MIN = 60.0;
    private static final double MIN_PER_HOUR = 60.0;
    private static final double EPS = QueueWaitWindow.EPS;

    private final QueueWaitWindow window;
    private final Computed<Double> arrival;
    private final Computed<Double> service;
    private final int targetExclusiveSec;

    /**
     * @param arrival            예상 유입률 λ (명/시간). 예측 구간 동안 일정하다고 본다
     * @param service            시설 1개 처리율 μ (명/시간)
     * @param targetExclusiveSec 목표 — 평균 대기시간이 이 값(초) 미만
     */
    public WaitAvgForecast(QueueWaitWindow window, Computed<Double> arrival, Computed<Double> service, int targetExclusiveSec) {
        this.window = Objects.requireNonNull(window, "window");
        this.arrival = Objects.requireNonNull(arrival, "arrival");
        this.service = Objects.requireNonNull(service, "service");
        this.targetExclusiveSec = targetExclusiveSec;
    }

    public int getTargetExclusiveSec() {
        return targetExclusiveSec;
    }

    /**
     * @param fcstMin    예측 평균을 보고할 시각 (t + fcstMin)
     * @param horizonMin 목표 도달을 찾는 범위 (분)
     */
    public Projection project(Integer serverCnt, int fcstMin, int horizonMin) {
        String gap = gapOf(serverCnt);

        if (gap != null) {
            Computed<Double> unavailable = Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST, gap);
            return new Projection(unavailable, unavailable);
        }

        Trace trace = simulate(serverCnt, Math.max(fcstMin, horizonMin));

        return new Projection(clearOf(trace, serverCnt, horizonMin), avgAt(trace, fcstMin));
    }

    /** 목표 시간 안에 목표 미만이 되고 처리능력이 유입보다 큰 최소 시설 수 (현재 운영분 포함 총수) */
    public Search search(int targetMin) {
        if (targetMin <= 0) {
            throw new IllegalArgumentException("targetMin 은 양수입니다: " + targetMin);
        }

        String gap = gapOf(1);

        if (gap != null) {
            return Search.unavailable(targetMin, gap, null);
        }

        double lambda = arrival.getValue();
        double mu = service.getValue();
        double stableFloor = Math.floor(lambda / mu) + 1;

        if (!Double.isFinite(stableFloor) || stableFloor > SEARCH_LIMIT) {
            return Search.unavailable(targetMin, "안정 조건 최소 수량이 탐색 상한(" + SEARCH_LIMIT + "개)을 넘습니다.", null);
        }

        int stableMinCnt = (int) stableFloor;
        // 이 수량부터는 대기열과 매분 유입이 모두 그 분에 처리돼 결과가 같다
        double saturationCnt = Math.ceil((window.queuePsgCnt() + lambda / MIN_PER_HOUR) * MIN_PER_HOUR / mu);
        boolean capped = !Double.isFinite(saturationCnt) || saturationCnt > SEARCH_LIMIT;
        int upperCnt = capped ? SEARCH_LIMIT : Math.max(stableMinCnt, (int) saturationCnt);
        Integer goalOnlyMinCnt = null;

        // 후보마다 같은 시작 상태에서 따로 예측한다. 평균은 수량에 단조라고 보장할 수 없어 작은 수량부터 모두 확인한다
        for (int serverCnt = 0; serverCnt <= upperCnt; serverCnt++) {
            if (!meetsTarget(simulate(serverCnt, targetMin), targetMin)) {
                continue;
            }

            if (goalOnlyMinCnt == null) {
                goalOnlyMinCnt = serverCnt;
            }

            if (serverCnt >= stableMinCnt) {
                return new Search(targetMin, Computed.estimated(serverCnt, CalculationMethod.WAIT_AVG_FORECAST,
                        targetMin + "분 안에 직전 30분 처리 여객 평균이 " + targetExclusiveSec + "초 미만이 되고 처리능력이 유입보다 큰 최소 총수"),
                        stableMinCnt, goalOnlyMinCnt);
            }
        }

        if (capped) {
            return Search.unavailable(targetMin, "탐색 상한(" + SEARCH_LIMIT + "개) 안에서 목표를 만족하는 수량을 찾지 못했습니다.", stableMinCnt);
        }

        return new Search(targetMin, Computed.unreachable(CalculationMethod.WAIT_AVG_FORECAST,
                upperCnt + "개 이상은 대기열이 즉시 처리돼 결과가 같습니다. 이미 처리된 여객과 오래 기다린 대기자의 대기시간이 창에 남아 "
                        + targetMin + "분 안에 목표 미만이 되지 않습니다."),
                stableMinCnt, goalOnlyMinCnt);
    }

    /** 추천 수량 재검증 — 목표 시간 안 도달, 목표 시각 평균, 처리능력 > 유입 */
    public boolean verify(int serverCnt, int targetMin) {
        if (serverCnt <= 0 || gapOf(serverCnt) != null || serverCnt * service.getValue() <= arrival.getValue()) {
            return false;
        }

        return meetsTarget(simulate(serverCnt, targetMin), targetMin);
    }

    private String gapOf(Integer serverCnt) {
        if (window.getHistoryGap() != null) {
            return window.getHistoryGap();
        }

        if (window.getCohortGap() != null) {
            return window.getCohortGap();
        }

        if (serverCnt == null) {
            return "운영 수량이 없습니다.";
        }

        if (!arrival.hasValue()) {
            return "예상 유입률을 구할 수 없습니다. " + arrival.getReason();
        }

        if (serverCnt > 0 && !service.hasValue()) {
            return "시설 처리율을 구할 수 없습니다. " + service.getReason();
        }

        return null;
    }

    private Trace simulate(int serverCnt, int minutes) {
        double capPerMin = serverCnt == 0 ? 0 : serverCnt * service.getValue() / MIN_PER_HOUR;
        double arrivalPerMin = arrival.getValue() / MIN_PER_HOUR;
        ArrayDeque<double[]> queue = window.copyQueue();
        double queueCnt = window.queuePsgCnt();
        double[] prcs = new double[minutes];
        double[] wtngSec = new double[minutes];
        double[] remain = new double[minutes];

        for (int minute = 0; minute < minutes; minute++) {
            if (arrivalPerMin > 0) {
                queue.addLast(new double[] { minute, arrivalPerMin });
                queueCnt += arrivalPerMin;
            }

            double capacity = capPerMin;

            while (capacity > EPS && !queue.isEmpty()) {
                double[] head = queue.peekFirst();
                double take = Math.min(capacity, head[1]);

                prcs[minute] += take;
                wtngSec[minute] += take * (minute - head[0]) * SEC_PER_MIN;
                head[1] -= take;
                capacity -= take;
                queueCnt -= take;

                if (head[1] <= EPS) {
                    queue.pollFirst();
                }
            }

            remain[minute] = Math.max(queueCnt, 0);
        }

        return new Trace(window, prcs, wtngSec, remain);
    }

    private Computed<Double> clearOf(Trace trace, int serverCnt, int horizonMin) {
        int reachMin = trace.reachMin(targetExclusiveSec, horizonMin);

        if (reachMin == 0) {
            return Computed.calculated(0.0, CalculationMethod.WAIT_AVG_FORECAST,
                    "직전 30분 처리 여객 평균이 이미 " + targetExclusiveSec + "초 미만입니다.");
        }

        if (reachMin > 0) {
            return Computed.estimated(reachMin * SEC_PER_MIN, CalculationMethod.WAIT_AVG_FORECAST,
                    reachMin + "분 후 직전 30분 처리 여객 예측 평균이 " + targetExclusiveSec + "초 미만이 됩니다.");
        }

        double capacity = serverCnt == 0 ? 0 : serverCnt * service.getValue();

        if (capacity <= arrival.getValue()) {
            return Computed.unreachable(CalculationMethod.WAIT_AVG_FORECAST,
                    "처리능력이 유입 이하라 " + horizonMin + "분 예측 범위 안에서 평균 대기시간이 목표 미만으로 내려가지 않습니다.");
        }

        return Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST, horizonMin + "분 예측 범위 안에 목표 미만에 도달하지 않습니다.");
    }

    private Computed<Double> avgAt(Trace trace, int fcstMin) {
        Double value = trace.avgAt(fcstMin);

        if (value == null) {
            return Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST,
                    fcstMin + "분 후 직전 30분에 처리될 여객이 없습니다. 예측 대기열 " + Math.round(trace.remainAt(fcstMin)) + "명");
        }

        return Computed.estimated(value, CalculationMethod.WAIT_AVG_FORECAST,
                fcstMin + "분 후 시각의 직전 30분 처리 여객 예측 평균 대기시간");
    }

    private boolean meetsTarget(Trace trace, int targetMin) {
        if (trace.reachMin(targetExclusiveSec, targetMin) < 0) {
            return false;
        }

        Double atTarget = trace.avgAt(targetMin);

        // 목표 시각 창에 처리 여객이 없으면 남은 대기자가 없을 때만 충족으로 본다 (0초로 간주하지 않는다)
        return atTarget == null ? trace.remainAt(targetMin) <= EPS : atTarget < targetExclusiveSec;
    }

    /** 예측 1회의 분별 결과. 창 끝 j 분(t+j)의 평균은 실제 이력 [t-30+j, t) 와 예측 [max(0, j-30), j) 를 합친다 */
    private static final class Trace {
        private final double[] histPrcsSuffix = new double[WINDOW_MIN + 1];
        private final double[] histWtngSuffix = new double[WINDOW_MIN + 1];
        private final double[] predPrcsPrefix;
        private final double[] predWtngPrefix;
        private final double[] remain;

        private Trace(QueueWaitWindow window, double[] prcs, double[] wtngSec, double[] remain) {
            for (int index = WINDOW_MIN - 1; index >= 0; index--) {
                histPrcsSuffix[index] = histPrcsSuffix[index + 1] + window.prcsAt(index);
                histWtngSuffix[index] = histWtngSuffix[index + 1] + window.wtngSecAt(index);
            }

            this.predPrcsPrefix = new double[prcs.length + 1];
            this.predWtngPrefix = new double[prcs.length + 1];

            for (int index = 0; index < prcs.length; index++) {
                predPrcsPrefix[index + 1] = predPrcsPrefix[index] + prcs[index];
                predWtngPrefix[index + 1] = predWtngPrefix[index] + wtngSec[index];
            }

            this.remain = remain;
        }

        private Double avgAt(int endMin) {
            int histFrom = Math.min(endMin, WINDOW_MIN);
            int predFrom = Math.max(0, endMin - WINDOW_MIN);
            double prcsSum = histPrcsSuffix[histFrom] + predPrcsPrefix[endMin] - predPrcsPrefix[predFrom];
            double wtngSum = histWtngSuffix[histFrom] + predWtngPrefix[endMin] - predWtngPrefix[predFrom];

            return prcsSum <= EPS ? null : wtngSum / prcsSum;
        }

        private int reachMin(int targetExclusiveSec, int horizonMin) {
            for (int endMin = 0; endMin <= horizonMin; endMin++) {
                Double value = avgAt(endMin);

                if (value != null && value < targetExclusiveSec) {
                    return endMin;
                }
            }

            return -1;
        }

        private double remainAt(int endMin) {
            return endMin == 0 ? Double.NaN : remain[endMin - 1];
        }
    }

    public static final class Projection {
        private final Computed<Double> clearSec;
        private final Computed<Double> fcstWtngSec;

        private Projection(Computed<Double> clearSec, Computed<Double> fcstWtngSec) {
            this.clearSec = clearSec;
            this.fcstWtngSec = fcstWtngSec;
        }

        /** 목표 미만 도달까지 걸리는 시간 (초, 1분 해상도). 이미 미만이면 0 */
        public Computed<Double> getClearSec() {
            return clearSec;
        }

        /** 보고 시각의 직전 30분 처리 여객 예측 평균 대기시간 (초) */
        public Computed<Double> getFcstWtngSec() {
            return fcstWtngSec;
        }
    }

    public static final class Search {
        private final int targetMin;
        private final Computed<Integer> reqCnt;
        private final Integer stableMinCnt;
        private final Integer goalOnlyMinCnt;

        private Search(int targetMin, Computed<Integer> reqCnt, Integer stableMinCnt, Integer goalOnlyMinCnt) {
            this.targetMin = targetMin;
            this.reqCnt = reqCnt;
            this.stableMinCnt = stableMinCnt;
            this.goalOnlyMinCnt = goalOnlyMinCnt;
        }

        private static Search unavailable(int targetMin, String reason, Integer stableMinCnt) {
            return new Search(targetMin, Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST, reason), stableMinCnt, null);
        }

        public int getTargetMin() {
            return targetMin;
        }

        public Computed<Integer> getReqCnt() {
            return reqCnt;
        }

        /** 처리능력 s×μ 가 유입 λ 보다 큰 최소 수량 floor(λ/μ)+1. 산정 불가면 null */
        public Integer getStableMinCnt() {
            return stableMinCnt;
        }

        /** 안정 조건 없이 목표 시간만 만족하는 최소 수량. 없으면 null */
        public Integer getGoalOnlyMinCnt() {
            return goalOnlyMinCnt;
        }
    }
}
