package aoms.pm.cast.domains.queue;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

/**
 * 평가시각 t 의 혼잡 판정 원천 — [t-30분, t) 분별 처리 이력과 t 에 남은 대기열의 도착 시각.
 * 관측 평균과 미래 예측(WaitAvgForecast)이 같은 이력을 쓴다.
 */
public final class QueueWaitWindow {
    public static final int WINDOW_MIN = 30;

    static final double EPS = 1e-9;

    private final double[] prcsPsgCnt;
    private final double[] wtngSecSum;
    private final double observedPrcsTotal;
    private final double observedWtngSecTotal;
    private final String historyGap;
    private final List<Cohort> cohortList;
    private final String cohortGap;

    /**
     * @param prcsPsgCnt [t-30, t) 분별 처리인원 (길이 30)
     * @param wtngSecSum 같은 분에 처리된 여객의 대기시간 합 (초)
     * @param historyGap 30분 전체를 관측하지 못한 사유. 관측했으면 null
     * @param cohortList t 에 남은 대기열 — 오래 기다린 순
     * @param cohortGap  남은 대기열의 도착 시각을 재구성하지 못한 사유. 재구성했으면 null
     */
    public QueueWaitWindow(double[] prcsPsgCnt, double[] wtngSecSum, String historyGap, List<Cohort> cohortList, String cohortGap) {
        this(prcsPsgCnt, wtngSecSum, historyGap, cohortList, cohortGap, sum(prcsPsgCnt), sum(wtngSecSum));
    }

    public QueueWaitWindow(double[] prcsPsgCnt, double[] wtngSecSum, String historyGap, List<Cohort> cohortList, String cohortGap,
            double observedPrcsTotal, double observedWtngSecTotal) {
        if (prcsPsgCnt.length != WINDOW_MIN || wtngSecSum.length != WINDOW_MIN) {
            throw new IllegalArgumentException("처리 이력은 " + WINDOW_MIN + "분 길이여야 합니다.");
        }

        this.prcsPsgCnt = prcsPsgCnt.clone();
        this.wtngSecSum = wtngSecSum.clone();
        this.observedPrcsTotal = observedPrcsTotal;
        this.observedWtngSecTotal = observedWtngSecTotal;
        this.historyGap = historyGap;
        this.cohortList = new ArrayList<>(cohortList);
        this.cohortGap = cohortGap;
    }

    public static QueueWaitWindow unavailable(String reason) {
        return new QueueWaitWindow(new double[WINDOW_MIN], new double[WINDOW_MIN], reason, List.of(), reason);
    }

    /** 직전 30분 처리 여객의 처리인원 가중평균 대기시간 (초, 소수 원값) */
    public Computed<Double> observedAvgWtngSec() {
        if (historyGap != null) {
            return Computed.unavailable(CalculationMethod.PRCS_WAIT_AVG, historyGap);
        }

        double prcsSum = observedPrcsTotal;

        if (prcsSum <= EPS) {
            return Computed.unavailable(CalculationMethod.PRCS_WAIT_AVG, "직전 30분에 처리된 여객이 없습니다.");
        }

        return Computed.calculated(observedWtngSecTotal / prcsSum, CalculationMethod.PRCS_WAIT_AVG,
                "[t-30분, t) 처리 여객 " + Math.round(prcsSum) + "명의 처리인원 가중평균 대기시간");
    }

    public double observedPrcsPsgCnt() {
        return observedPrcsTotal;
    }

    double observedWtngSecSum() {
        return observedWtngSecTotal;
    }

    public double queuePsgCnt() {
        return cohortList.stream().mapToDouble(Cohort::getCount).sum();
    }

    String getHistoryGap() {
        return historyGap;
    }

    String getCohortGap() {
        return cohortGap;
    }

    double prcsAt(int index) {
        return prcsPsgCnt[index];
    }

    double wtngSecAt(int index) {
        return wtngSecSum[index];
    }

    /** 원소는 {도착 분(t 기준 상대값, 0 이하), 인원} */
    ArrayDeque<double[]> copyQueue() {
        ArrayDeque<double[]> result = new ArrayDeque<>();

        for (Cohort cohort : cohortList) {
            result.addLast(new double[] { -cohort.ageMin, cohort.count });
        }

        return result;
    }

    private static double sum(double[] values) {
        double result = 0;

        for (double value : values) {
            result += value;
        }

        return result;
    }

    /** 같은 분에 줄을 선 여객 묶음. 처리되면 대기시간 = 처리 분 - 도착 분 */
    public static final class Cohort {
        private final int ageMin;
        private final double count;

        /** @param ageMin t 기준 도착 후 경과 분 (t-1분 도착이면 1) */
        public Cohort(int ageMin, double count) {
            if (ageMin < 0 || !Double.isFinite(count) || count < 0) {
                throw new IllegalArgumentException("대기열 묶음이 올바르지 않습니다. ageMin=" + ageMin + ", count=" + count);
            }

            this.ageMin = ageMin;
            this.count = count;
        }

        public int getAgeMin() {
            return ageMin;
        }

        public double getCount() {
            return count;
        }
    }
}
