package aoms.pm.cast.domains.queue;

/**
 * M/M/s 정상상태 모형의 산출값
 * 평균 대기시간 Wq = C / (s*mu - lambda)
 * 평균 대기인원 Lq = lambda * Wq이다.
 */
public final class ErlangCResult {
    private final double arrivalRatePerHour; // 유입률 lambda(명/시간)
    private final double serviceRatePerHour; // 시설 하나의 처리율 mu(명/시간)
    private final int serverCnt; // 서버 수 s
    private final double loadRatio; // 부하율(rho) = lambda / (s*mu)
    private final double waitProbability; // 대기확률(C)
    private final double modelAvgWtngTimeSec; // Wq(초) 평균 대기시간
    private final double modelAvgQueuePsgCnt; // Lq(명) 평균 대기인원
    private final double spareCapacityPerHour; // 처리 여유 용량(명/시간) s*mu - lambda

    ErlangCResult(double arrivalRatePerHour, double serviceRatePerHour, int serverCnt,
            double loadRatio, double waitProbability, double modelAvgWtngTimeSec,
            double modelAvgQueuePsgCnt, double spareCapacityPerHour) {
        this.arrivalRatePerHour = arrivalRatePerHour;
        this.serviceRatePerHour = serviceRatePerHour;
        this.serverCnt = serverCnt;
        this.loadRatio = loadRatio;
        this.waitProbability = waitProbability;
        this.modelAvgWtngTimeSec = modelAvgWtngTimeSec;
        this.modelAvgQueuePsgCnt = modelAvgQueuePsgCnt;
        this.spareCapacityPerHour = spareCapacityPerHour;
    }

    
    public double getArrivalRatePerHour() { return arrivalRatePerHour; }
    public double getServiceRatePerHour() { return serviceRatePerHour; }
    public int getServerCnt() { return serverCnt; }
    public double getLoadRatio() { return loadRatio; }
    public double getWaitProbability() { return waitProbability; }
    public double getModelAvgWtngTimeSec() { return modelAvgWtngTimeSec; }
    public double getModelAvgQueuePsgCnt() { return modelAvgQueuePsgCnt; }

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
        double scaledTime = spareCapacityPerHour *(targetWaitSec / 3600.0);
        double probability = (1.0 - waitProbability) + waitProbability * -Math.expm1(-scaledTime);
        return MetricResult.estimated(probability, CalculationMethod.ERLANG_C, "M/M/s 정상상태에서 목표 대기시간(초) 이내에 서비스를 시작할 모형 확률");
    }
}
