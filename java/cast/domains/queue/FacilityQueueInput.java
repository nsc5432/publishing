package aoms.pm.cast.domains.queue;

import lombok.Builder;
import lombok.Getter;

/**
 * 큐 구간(FacilityQueueCalculator)에 적용할 운영 시설 수/유입률 등 시나리오 조건 관리
 */
@Getter
public final class FacilityQueueInput {
    private final Integer oprServerCnt; // 시설 수 s
    private final Integer totServerCnt; // 큐에 배정 가능한 최대 시설 수
    private final Double arrivalRatePerHour; // 유입률 lambda(명/시간) -> null이면 Little's Law로 추정한다.
    private final boolean arrivalRateEstimated; // 추정값인지, 관측값인지
    private final Integer wtngEndPsgCnt; // 대기종료인원(구간 중 대기를 마치고 처리 시작)
    private final Integer prcsPsgCnt; // 처리완료인원
    private final Integer queuePsgCntAtStart; // 대기인원(시작)

    /** 모든 처리시설의 실제 처리 중 시간을 합한 값(시설·초). 예: 2개가 각각 300초 처리하면 600이다. */
    private final Double busyServerTimeSec;

    /** 모든 처리시설의 운영 가능 시간을 합한 값(시설·초). 휴게·중간 개폐를 반영한다. */
    private final Double availableServerTimeSec;

    /** 시간평균 큐 인원과 여객평균 대기시간의 범위가 대응하고 구간 경계 효과가 충분히 작다고 확인했는지 여부. */
    private final boolean littleLawApplicable;

    /** 이 큐의 여객이 모든 대상 시설을 이용할 수 있고 시설별 평균 처리율이 동등하다고 확인했는지 여부. */
    private final boolean sharedHomogeneousServers;

    /** 예측 구간 동안 유입률·처리율·운영 시설 수가 유지된다고 가정할 수 있는지 여부. */
    private final boolean constantRates;

    /** 큐 이탈, 다른 큐로 이동, 측정영역 재설정이 없다고 확인했는지 여부. 인원 보존식에 필요하다. */
    private final boolean noAbandonmentOrTransfers;

    /** 포아송 도착·독립 지수 처리시간·선착순 처리·무한 대기공간 등 M/M/s 가정을 확인했는지 여부. */
    private final boolean mmSApplicable;

    @Builder
    private FacilityQueueInput(
        Integer oprServerCnt,
        Integer totServerCnt,
        Double arrivalRatePerHour,
        boolean arrivalRateEstimated,
        Integer wtngEndPsgCnt,
        Integer prcsPsgCnt,
        Integer queuePsgCntAtStart,
        Double busyServerTimeSec,
        Double availableServerTimeSec,
        boolean littleLawApplicable,
        boolean sharedHomogeneousServers,
        boolean constantRates,
        boolean noAbandonmentOrTransfers,
        boolean mmSApplicable
    ) {
        QueueInputValidation.nonNegative(oprServerCnt, "oprServerCnt");
        QueueInputValidation.nonNegative(totServerCnt, "totServerCnt");
        QueueInputValidation.nonNegative(arrivalRatePerHour, "arrivalRatePerHour");
        QueueInputValidation.nonNegative(wtngEndPsgCnt, "wtngEndPsgCnt");
        QueueInputValidation.nonNegative(prcsPsgCnt, "prcsPsgCnt");
        QueueInputValidation.nonNegative(queuePsgCntAtStart, "queuePsgCntAtStart");
        QueueInputValidation.nonNegative(busyServerTimeSec, "busyServerTimeSec");
        QueueInputValidation.nonNegative(availableServerTimeSec, "availableServerTimeSec");

        if (oprServerCnt != null && totServerCnt != null && oprServerCnt > totServerCnt) {
            throw new IllegalArgumentException("운영 시설 수(oprServerCnt)는 배정 가능한 최대 시설 수(totServerCnt)를 초과할 수 없습니다.");
        }

        if (busyServerTimeSec != null && availableServerTimeSec != null && busyServerTimeSec > availableServerTimeSec) {
            throw new IllegalArgumentException("처리 중 시간(busyServerTimeSec)은 운영 가능 시간(availableServerTimeSec)을 초과할 수 없습니다.");
        }

        this.oprServerCnt = oprServerCnt;
        this.totServerCnt = totServerCnt;
        this.arrivalRatePerHour = arrivalRatePerHour;
        this.arrivalRateEstimated = arrivalRateEstimated;
        this.wtngEndPsgCnt = wtngEndPsgCnt;
        this.prcsPsgCnt = prcsPsgCnt;
        this.queuePsgCntAtStart = queuePsgCntAtStart;
        this.busyServerTimeSec = busyServerTimeSec;
        this.availableServerTimeSec = availableServerTimeSec;
        this.littleLawApplicable = littleLawApplicable;
        this.sharedHomogeneousServers = sharedHomogeneousServers;
        this.constantRates = constantRates;
        this.noAbandonmentOrTransfers = noAbandonmentOrTransfers;
        this.mmSApplicable = mmSApplicable;
    }
}
