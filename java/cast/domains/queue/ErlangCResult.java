package aoms.pm.cast.domains.queue;

/**
 * M/M/s 정상상태 모형의 산출값
 * 평균 대기시간 Wq = C / (s*mu - lambda)
 * 평균 대기인원 Lq = lambda * Wq이다.
 */
public final class ErlangCResult {
    private final double loadRatio; // 부하율(rho) = lambda / (s*mu)
    private final double waitProbability; // 대기확률(C)
    private final double modelAvgWtngTimeSec; // Wq(초) 평균 대기시간
    private final double modelAvgQueuePsgCnt; // Lq(명) 평균 대기인원

    ErlangCResult(double loadRatio, double waitProbability, double modelAvgWtngTimeSec, double modelAvgQueuePsgCnt) {
        this.loadRatio = loadRatio;
        this.waitProbability = waitProbability;
        this.modelAvgWtngTimeSec = modelAvgWtngTimeSec;
        this.modelAvgQueuePsgCnt = modelAvgQueuePsgCnt;
    }

    public double getLoadRatio() { return loadRatio; }
    public double getWaitProbability() { return waitProbability; }
    public double getModelAvgWtngTimeSec() { return modelAvgWtngTimeSec; }
    public double getModelAvgQueuePsgCnt() { return modelAvgQueuePsgCnt; }
}
