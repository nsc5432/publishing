package aoms.pm.cast.domains.queue;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * M/M/s 정상상태 모형의 산출값
 * 평균 대기시간 Wq = C / (s*mu - lambda)
 * 평균 대기인원 Lq = lambda * Wq이다.
 */
@Getter
@AllArgsConstructor
public final class ErlangCResult {
    private final double loadRatio; // 부하율(rho) = lambda / (s*mu)
    private final double waitProbability; // 대기확률(C)
    private final double modelAvgWtngTimeSec; // Wq(초) 평균 대기시간
    private final double modelAvgQueuePsgCnt; // Lq(명) 평균 대기인원
}
