package aoms.pm.cast.domains.queue;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * 시설 수 s 를 평가시각 t 부터 적용했을 때 미래 시각 u 의 직전 10분 [u-10분, u) 처리 여객 평균 대기시간을 예측한다.
 * 창의 t 이전 부분은 실제 처리 이력, t 이후 부분은 1분 단위 유체 FIFO 예측이다.
 * 남은 대기자의 대기시간은 t 에서 0 으로 되돌리지 않고, 이미 처리된 여객의 대기시간은 시설 수와 무관하다.
 * 해소는 판정 구간 [t, t+judgeMin] 안에서 평균이 목표 미만이 된 뒤 구간 끝까지 다시 목표 이상이 되지 않는 첫 시각이다.
 * 구간 끝 대기인원이 t 보다 많으면 구간 뒤에 다시 혼잡해지므로 해소로 보지 않는다.
 */
public final class WaitAvgForecast {
    /** 지속 해소 판정 구간의 최소 길이 (분). 목표 시간이 더 길면 목표 시간까지 본다 */
    public static final int JUDGE_MIN = 60;

    private static final int WINDOW_MIN = QueueWaitWindow.WINDOW_MIN;
    private static final int SEARCH_LIMIT = 100_000;
    private static final double SEC_PER_MIN = 60.0;
    private static final double MIN_PER_HOUR = 60.0;
    // 소수 처리용량을 분마다 빼며 남는 이보다 작은 잔량은 여객이 없는 것으로 본다
    private static final double MIN_PSG_CNT = 1e-9;

    private final QueueWaitWindow window;
    private final Computed<Double> arrival;
    private final double[] arrivalPerMin;
    private final Computed<Double> service;
    private final int targetExclusiveSec;

    /**
     * @param arrival            예상 유입률 λ (명/시간). arrivalPerMin 이 없을 때 예측 구간 동안 일정하다고 보고 쓴다
     * @param arrivalPerMin      기준시각부터 분별 유입 (명). 배열 뒤는 유입 0. null 이면 arrival 을 쓴다
     * @param service            시설 1개 처리율 μ (명/시간)
     * @param targetExclusiveSec 목표 — 평균 대기시간이 이 값(초) 미만
     */
    public WaitAvgForecast(QueueWaitWindow window, Computed<Double> arrival, double[] arrivalPerMin, Computed<Double> service, int targetExclusiveSec) {
        this.window = Objects.requireNonNull(window, "window");
        this.arrival = Objects.requireNonNull(arrival, "arrival");
        this.arrivalPerMin = arrivalPerMin == null ? null : arrivalPerMin.clone();
        this.service = Objects.requireNonNull(service, "service");
        this.targetExclusiveSec = targetExclusiveSec;
    }

    public static int judgeMinOf(int targetMin) {
        return Math.max(targetMin, JUDGE_MIN);
    }

    public int getTargetExclusiveSec() {
        return targetExclusiveSec;
    }

    /** 예측이 시간대별 CAST 유입을 쓰는지. false 면 arrival 하나를 이어 쓴다 */
    public boolean isArrivalProfiled() {
        return arrivalPerMin != null;
    }

    /** [fromMin, toMin) 예측 입력 유입 합 (명) */
    public Double arrivalSum(int fromMin, int toMin) {
        if (arrivalPerMin == null && !arrival.hasValue()) {
            return null;
        }

        double sum = 0;

        for (int minute = fromMin; minute < toMin; minute++) {
            sum += arrivalAt(minute);
        }

        return sum;
    }

    /**
     * @param fcstMin  예측 평균을 보고할 시각 (t + fcstMin)
     * @param judgeMin 지속 해소 판정 구간 (분)
     */
    public Projection project(Integer serverCnt, int fcstMin, int judgeMin) {
        String gap = gapOf(serverCnt);

        if (gap != null) {
            Computed<Double> unavailable = Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST, gap);
            return new Projection(unavailable, unavailable);
        }

        Trace trace = simulate(serverCnt, Math.max(fcstMin, judgeMin));

        return new Projection(clearOf(trace, judgeMin), avgAt(trace, fcstMin));
    }

    /** 시설 수 s 를 평가시각 t 부터 적용했을 때 [t, t+minutes) 예측 처리인원 */
    public Computed<Double> forecastPrcsPsgCnt(Integer serverCnt, int minutes) {
        String gap = gapOf(serverCnt);

        if (gap != null) {
            return Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST, gap);
        }

        return Computed.estimated(simulate(serverCnt, minutes).prcsUntil(minutes), CalculationMethod.WAIT_AVG_FORECAST,
                serverCnt + "개 적용 시 기준시각부터 " + minutes + "분 예측 처리인원");
    }

    /** 시설 수 s 의 [t, t+endMin] stepMin 간격 예측 평균 대기시간과 대기인원. 산정 불가면 빈 목록 */
    public List<Point> timeline(Integer serverCnt, int endMin, int stepMin) {
        if (gapOf(serverCnt) != null || stepMin <= 0) {
            return Collections.emptyList();
        }

        Trace trace = simulate(serverCnt, endMin);
        List<Point> result = new ArrayList<>();

        for (int minute = 0; minute <= endMin; minute += stepMin) {
            result.add(new Point(minute, trace.avgAt(minute), trace.remainAt(minute)));
        }

        return result;
    }

    /** 목표 시간 안에 지속 해소되는 최소 시설 수 (현재 운영분 포함 총수) */
    public Search search(int targetMin) {
        if (targetMin <= 0) {
            throw new IllegalArgumentException("targetMin 은 양수입니다: " + targetMin);
        }

        String gap = gapOf(1);

        if (gap != null) {
            return Search.unavailable(targetMin, gap);
        }

        int judgeMin = judgeMinOf(targetMin);
        double mu = service.getValue();
        double peakArrivalPerMin = 0;

        for (int minute = 0; minute < judgeMin; minute++) {
            peakArrivalPerMin = Math.max(peakArrivalPerMin, arrivalAt(minute));
        }

        // 이 수량부터는 대기열과 매분 유입이 모두 그 분에 처리돼 결과가 같다
        double saturationCnt = Math.ceil((window.queuePsgCnt() + peakArrivalPerMin) * MIN_PER_HOUR / mu);
        boolean capped = !Double.isFinite(saturationCnt) || saturationCnt > SEARCH_LIMIT;
        int upperCnt = capped ? SEARCH_LIMIT : Math.max(1, (int) saturationCnt);
        Integer goalOnlyMinCnt = null;

        // 후보마다 같은 시작 상태에서 따로 예측한다. 평균은 수량에 단조라고 보장할 수 없어 작은 수량부터 모두 확인한다
        for (int serverCnt = 0; serverCnt <= upperCnt; serverCnt++) {
            Trace trace = simulate(serverCnt, judgeMin);

            if (goalOnlyMinCnt == null && reachesOnce(trace, targetMin)) {
                goalOnlyMinCnt = serverCnt;
            }

            int clearMin = trace.sustainedMin(targetExclusiveSec, judgeMin);

            if (clearMin >= 0 && clearMin <= targetMin) {
                return new Search(targetMin, Computed.estimated(serverCnt, CalculationMethod.WAIT_AVG_FORECAST,
                        targetMin + "분 안에 직전 " + WINDOW_MIN + "분 처리 여객 평균이 " + targetExclusiveSec + "초 미만이 되고 "
                                + judgeMin + "분 판정 구간 끝까지 유지되며 구간 끝 대기인원이 기준시각보다 늘지 않는 최소 총수"),
                        goalOnlyMinCnt == null ? serverCnt : goalOnlyMinCnt);
            }
        }

        if (capped) {
            return Search.unavailable(targetMin, "탐색 상한(" + SEARCH_LIMIT + "개) 안에서 목표를 만족하는 수량을 찾지 못했습니다.");
        }

        return new Search(targetMin, Computed.unreachable(CalculationMethod.WAIT_AVG_FORECAST,
                upperCnt + "개 이상은 대기열이 즉시 처리돼 결과가 같습니다. 이미 처리된 여객과 오래 기다린 대기자의 대기시간이 창에 남아 "
                        + targetMin + "분 안에 목표 미만이 되지 않습니다."),
                goalOnlyMinCnt);
    }

    /** 추천 수량 재검증 — 목표 시간 안에 지속 해소되는지 */
    public boolean verify(int serverCnt, int targetMin) {
        if (serverCnt <= 0 || gapOf(serverCnt) != null) {
            return false;
        }

        int judgeMin = judgeMinOf(targetMin);
        int clearMin = simulate(serverCnt, judgeMin).sustainedMin(targetExclusiveSec, judgeMin);

        return clearMin >= 0 && clearMin <= targetMin;
    }

    private double arrivalAt(int minute) {
        if (arrivalPerMin == null) {
            return arrival.getValue() / MIN_PER_HOUR;
        }

        return minute < arrivalPerMin.length ? arrivalPerMin[minute] : 0;
    }

    private String gapOf(Integer serverCnt) {
        if (window.getHistoryGap() != null) {
            return window.getHistoryGap();
        }

        if (window.getPsgGroupGap() != null) {
            return window.getPsgGroupGap();
        }

        if (serverCnt == null) {
            return "운영 수량이 없습니다.";
        }

        if (arrivalPerMin == null && !arrival.hasValue()) {
            return "예상 유입률을 구할 수 없습니다. " + arrival.getReason();
        }

        if (serverCnt > 0 && !service.hasValue()) {
            return "시설 처리율을 구할 수 없습니다. " + service.getReason();
        }

        return null;
    }

    private Trace simulate(int serverCnt, int minutes) {
        double capPerMin = serverCnt == 0 ? 0 : serverCnt * service.getValue() / MIN_PER_HOUR;
        ArrayDeque<double[]> queue = window.copyQueue();
        double queueCnt = window.queuePsgCnt();
        double[] prcs = new double[minutes];
        double[] wtngSec = new double[minutes];
        double[] remain = new double[minutes];

        for (int minute = 0; minute < minutes; minute++) {
            double arrived = arrivalAt(minute);

            if (arrived > 0) {
                queue.addLast(new double[] { minute, arrived });
                queueCnt += arrived;
            }

            double capacity = capPerMin;

            while (capacity > MIN_PSG_CNT && !queue.isEmpty()) {
                double[] head = queue.peekFirst();
                double take = Math.min(capacity, head[1]);

                prcs[minute] += take;
                wtngSec[minute] += take * (minute - head[0]) * SEC_PER_MIN;
                head[1] -= take;
                capacity -= take;
                queueCnt -= take;

                if (head[1] <= MIN_PSG_CNT) {
                    queue.pollFirst();
                }
            }

            // queueCnt 는 가감을 누적한 값이라 대기열이 비어도 0 이 아닐 수 있다
            remain[minute] = queue.isEmpty() ? 0 : Math.max(queueCnt, 0);
        }

        return new Trace(window, prcs, wtngSec, remain);
    }

    private Computed<Double> clearOf(Trace trace, int judgeMin) {
        int clearMin = trace.sustainedMin(targetExclusiveSec, judgeMin);

        if (clearMin == 0) {
            return Computed.calculated(0.0, CalculationMethod.WAIT_AVG_FORECAST,
                    "직전 " + WINDOW_MIN + "분 처리 여객 평균이 이미 " + targetExclusiveSec + "초 미만이고 " + judgeMin + "분 판정 구간 끝까지 유지됩니다.");
        }

        if (clearMin > 0) {
            return Computed.estimated(clearMin * SEC_PER_MIN, CalculationMethod.WAIT_AVG_FORECAST,
                    clearMin + "분 후 직전 " + WINDOW_MIN + "분 처리 여객 예측 평균이 " + targetExclusiveSec + "초 미만이 되고 "
                            + judgeMin + "분 판정 구간 끝까지 유지됩니다.");
        }

        if (Math.round(trace.remainAt(judgeMin)) > Math.round(trace.remainAt(0))) {
            return Computed.unreachable(CalculationMethod.WAIT_AVG_FORECAST,
                    judgeMin + "분 판정 구간 끝 예측 대기인원 " + Math.round(trace.remainAt(judgeMin)) + "명이 기준시각 "
                            + Math.round(trace.remainAt(0)) + "명보다 많아 구간 뒤에 다시 혼잡해집니다.");
        }

        return Computed.unreachable(CalculationMethod.WAIT_AVG_FORECAST,
                judgeMin + "분 판정 구간 안에서 평균 대기시간이 목표 미만으로 내려간 뒤 끝까지 유지되지 않습니다.");
    }

    private Computed<Double> avgAt(Trace trace, int fcstMin) {
        Double value = trace.avgAt(fcstMin);

        if (value == null) {
            return Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST,
                    fcstMin + "분 후 직전 " + WINDOW_MIN + "분에 처리될 여객이 없습니다. 예측 대기열 " + Math.round(trace.remainAt(fcstMin)) + "명");
        }

        return Computed.estimated(value, CalculationMethod.WAIT_AVG_FORECAST,
                fcstMin + "분 후 시각의 직전 " + WINDOW_MIN + "분 처리 여객 예측 평균 대기시간");
    }

    // 지속 여부를 보지 않고 목표 시간 안에 한 번 목표 미만이 되고 목표 시각 평균도 미만인지
    private boolean reachesOnce(Trace trace, int targetMin) {
        if (trace.reachMin(targetExclusiveSec, targetMin) < 0) {
            return false;
        }

        Double atTarget = trace.avgAt(targetMin);

        return atTarget == null ? trace.remainAt(targetMin) == 0 : atTarget < targetExclusiveSec;
    }

    /** 예측 1회의 분별 결과. 창 끝 j 분(t+j)의 평균은 실제 이력 [t-10+j, t) 와 예측 [max(0, j-10), j) 를 합친다 */
    private static final class Trace {
        private final double[] histPrcsSuffix = new double[WINDOW_MIN + 1];
        private final double[] histWtngSuffix = new double[WINDOW_MIN + 1];
        private final double[] predPrcsPrefix;
        private final double[] predWtngPrefix;
        private final double[] remain;
        private final double startQueue;

        private Trace(QueueWaitWindow window, double[] prcs, double[] wtngSec, double[] remain) {
            for (int index = WINDOW_MIN - 1; index >= 0; index--) {
                histPrcsSuffix[index] = histPrcsSuffix[index + 1] + window.prcsAt(index);
                histWtngSuffix[index] = histWtngSuffix[index + 1] + window.wtngSecAt(index);
            }

            histPrcsSuffix[0] = window.observedPrcsPsgCnt();
            histWtngSuffix[0] = window.observedWtngSecSum();

            this.predPrcsPrefix = new double[prcs.length + 1];
            this.predWtngPrefix = new double[prcs.length + 1];

            for (int index = 0; index < prcs.length; index++) {
                predPrcsPrefix[index + 1] = predPrcsPrefix[index] + prcs[index];
                predWtngPrefix[index + 1] = predWtngPrefix[index] + wtngSec[index];
            }

            this.remain = remain;
            this.startQueue = window.queuePsgCnt();
        }

        private Double avgAt(int endMin) {
            int histFrom = Math.min(endMin, WINDOW_MIN);
            int predFrom = Math.max(0, endMin - WINDOW_MIN);
            double prcsSum = histPrcsSuffix[histFrom] + predPrcsPrefix[endMin] - predPrcsPrefix[predFrom];
            double wtngSum = histWtngSuffix[histFrom] + predWtngPrefix[endMin] - predWtngPrefix[predFrom];

            return prcsSum <= MIN_PSG_CNT ? null : wtngSum / prcsSum;
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

        // 처리 여객이 없는 분은 대기열이 비어 있을 때만 해소 상태로 본다
        private boolean isClear(int endMin, int targetExclusiveSec) {
            Double value = avgAt(endMin);

            return value == null ? remainAt(endMin) <= MIN_PSG_CNT : value < targetExclusiveSec;
        }

        /** 판정 구간 끝에서 거꾸로 이어지는 해소 상태 구간의 시작 분. 구간 끝이 해소 상태가 아니거나 대기인원이 시작보다 늘었으면 -1 */
        private int sustainedMin(int targetExclusiveSec, int judgeMin) {
            // 평균이 기준 아래여도 줄이 길어지면 구간 뒤에 다시 혼잡해진다. 표시 인원(반올림) 기준으로 비교한다
            if (Math.round(remainAt(judgeMin)) > Math.round(startQueue)) {
                return -1;
            }

            int result = -1;

            for (int endMin = judgeMin; endMin >= 0 && isClear(endMin, targetExclusiveSec); endMin--) {
                result = endMin;
            }

            return result;
        }

        private double prcsUntil(int endMin) {
            return predPrcsPrefix[endMin];
        }

        private double remainAt(int endMin) {
            return endMin == 0 ? startQueue : remain[endMin - 1];
        }
    }

    public static final class Point {
        private final int minute;
        private final Double avgWtngSec;
        private final double queuePsgCnt;

        private Point(int minute, Double avgWtngSec, double queuePsgCnt) {
            this.minute = minute;
            this.avgWtngSec = avgWtngSec;
            this.queuePsgCnt = queuePsgCnt;
        }

        /** 기준시각부터 분 */
        public int getMinute() {
            return minute;
        }

        /** 그 시각 직전 10분 처리 여객 예측 평균 대기시간 (초). 처리 여객이 없으면 null */
        public Double getAvgWtngSec() {
            return avgWtngSec;
        }

        /** 그 시각 예측 대기인원 */
        public double getQueuePsgCnt() {
            return queuePsgCnt;
        }
    }

    public static final class Projection {
        private final Computed<Double> clearSec;
        private final Computed<Double> fcstWtngSec;

        private Projection(Computed<Double> clearSec, Computed<Double> fcstWtngSec) {
            this.clearSec = clearSec;
            this.fcstWtngSec = fcstWtngSec;
        }

        /** 지속 해소까지 걸리는 시간 (초, 1분 해상도). 이미 미만이고 판정 구간 끝까지 유지되면 0 */
        public Computed<Double> getClearSec() {
            return clearSec;
        }

        /** 보고 시각의 직전 10분 처리 여객 예측 평균 대기시간 (초) */
        public Computed<Double> getFcstWtngSec() {
            return fcstWtngSec;
        }
    }

    public static final class Search {
        private final int targetMin;
        private final Computed<Integer> reqCnt;
        private final Integer goalOnlyMinCnt;

        private Search(int targetMin, Computed<Integer> reqCnt, Integer goalOnlyMinCnt) {
            this.targetMin = targetMin;
            this.reqCnt = reqCnt;
            this.goalOnlyMinCnt = goalOnlyMinCnt;
        }

        private static Search unavailable(int targetMin, String reason) {
            return new Search(targetMin, Computed.unavailable(CalculationMethod.WAIT_AVG_FORECAST, reason), null);
        }

        public int getTargetMin() {
            return targetMin;
        }

        public Computed<Integer> getReqCnt() {
            return reqCnt;
        }

        /** 지속 여부 없이 목표 시간 안에 한 번 목표 미만이 되는 최소 수량. 없으면 null */
        public Integer getGoalOnlyMinCnt() {
            return goalOnlyMinCnt;
        }
    }
}
