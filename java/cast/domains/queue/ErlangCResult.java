package aoms.pm.cast.domains.queue;

/**
 * M/M/s 정상상태 모형의 이론값이다. CAST/Xovis 관측값을 대신하는 실적 객체가 아니다.
 *
 * <p>평균 대기시간 Wq=C/(s*mu-lambda), 평균 대기인원 Lq=lambda*Wq이다.
 * 유입률·처리율은 명/시간, 반환 대기시간은 초이므로 단위 변환이 필요하다.
 * lambda가 총 처리능력 이상이면 이 객체를 생성하지 않고 분석 결과를 UNAVAILABLE로 반환한다.</p>
 */
public final class ErlangCResult {
    /** 모형에 사용한 유입률 lambda(명/시간). */
    private final double arrivalRatePerHour;
    /** 시설 하나의 처리율 mu(명/시간). */
    private final double serviceRatePerHour;
    /** 같은 큐를 처리하는 동등한 서버 수 s. */
    private final int serverCnt;
    /** rho=lambda/(s*mu). 이 객체가 생성되었다면 0 이상 1 미만이다. */
    private final double loadRatio;
    /** 도착한 여객이 즉시 처리되지 못하고 기다릴 확률 C. */
    private final double waitProbability;
    /** 기다리지 않은 여객도 포함하는 전체 도착 여객의 이론 평균 대기시간(초). */
    private final double theoreticalAvgWtngTimeSec;
    /** 시간평균 대기인원의 이론값 Lq(명). */
    private final double theoreticalAvgQueuePsgCnt;
    /** s*mu-lambda(명/시간). 정상상태 조건에서 양수이다. */
    private final double netRatePerHour;

    ErlangCResult(double arrivalRatePerHour, double serviceRatePerHour, int serverCnt,
            double loadRatio, double waitProbability, double theoreticalAvgWtngTimeSec,
            double theoreticalAvgQueuePsgCnt, double netRatePerHour) {
        this.arrivalRatePerHour = arrivalRatePerHour;
        this.serviceRatePerHour = serviceRatePerHour;
        this.serverCnt = serverCnt;
        this.loadRatio = loadRatio;
        this.waitProbability = waitProbability;
        this.theoreticalAvgWtngTimeSec = theoreticalAvgWtngTimeSec;
        this.theoreticalAvgQueuePsgCnt = theoreticalAvgQueuePsgCnt;
        this.netRatePerHour = netRatePerHour;
    }

    /** 모형 입력 유입률(명/시간). */
    public double getArrivalRatePerHour() { return arrivalRatePerHour; }
    /** 모형 입력 단일 시설 처리율(명/시간). */
    public double getServiceRatePerHour() { return serviceRatePerHour; }
    /** 모형 입력 운영 시설 수. */
    public int getServerCnt() { return serverCnt; }
    /** 유입 부하 비율. 관측 처리 중 시간으로 구한 실제 가동률과는 다르다. */
    public double getLoadRatio() { return loadRatio; }
    /** 기다림이 발생할 확률. 기다리는 사람의 비율이지 대기시간 자체가 아니다. */
    public double getWaitProbability() { return waitProbability; }
    /** 이론 평균 대기시간(초). 기다리지 않는 여객의 0초도 평균에 포함된다. */
    public double getTheoreticalAvgWtngTimeSec() { return theoreticalAvgWtngTimeSec; }
    /** 이론 시간평균 대기인원(명). */
    public double getTheoreticalAvgQueuePsgCnt() { return theoreticalAvgQueuePsgCnt; }

    /**
     * 목표시간 T초 이내에 서비스를 시작할 확률 {@code P(Wq <= T)}를 계산한다.
     * P=1-C*exp(-(s*mu-lambda)*T/3600). T=0이면 즉시 처리 확률 1-C이다.
     * 처리 완료까지의 시간이나 실제 SLA 달성률이 아니라 모형상 서비스 시작 확률이다.
     *
     * <p>1-exp(-x)를 -expm1(-x)로 계산하면 아주 작은 x에서도 뺄셈에 의한 오차를 줄일 수 있다.
     * 확률을 소수로 반환하므로 0.95는 95%이다.</p>
     */
    public MetricResult<Double> estimateServiceLevel(double targetWaitSec) {
        QueueInputValidation.nonNegative(Double.valueOf(targetWaitSec), "targetWaitSec");
        double scaledTime = netRatePerHour * (targetWaitSec / 3600.0);
        double probability = (1.0 - waitProbability) + waitProbability * -Math.expm1(-scaledTime);
        return MetricResult.estimated(probability, CalculationMethod.ERLANG_C,
                "M/M/s 정상상태에서 목표 대기시간(초) 이내에 서비스를 시작할 이론 확률");
    }
}
