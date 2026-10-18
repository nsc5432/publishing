package aoms.pm.cast.domains.queue;

import lombok.Builder;
import lombok.Value;

/**
 * 큐 구간(FacilityQueueCalculator)에 적용할 운영 시설 수/유입률 등 시나리오 조건 관리
 */
@Value
@Builder
public class FacilityQueueInput {
    Integer oprServerCnt; // 시설 수 s
    Double arrivalRatePerHour; // 유입률 lambda(명/시간) -> null이면 Little's Law로 추정한다.
    boolean arrivalRateEstimated; // 추정값인지, 관측값인지
    Integer wtngEndPsgCnt; // 대기종료인원(구간 중 대기를 마치고 처리 시작)
    Integer prcsPsgCnt; // 처리완료인원
    Integer queuePsgCntAtStart; // 대기인원(시작)

    boolean littleLawApplicable; // 리틀의법칙 λ = Lq/Wq 공식 사용가능한 환경인지
    boolean erlangCApplicable; // M/M/s 모델 기반 Erlang-C 공식 적용 가능한 환경인지 여부
}
