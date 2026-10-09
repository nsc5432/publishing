package aoms.pm.cast.domains.queue;

/**
 * 관측값에 추가할 운영조건과 분석 가정을 보관하는 불변 객체이다.
 *
 * <p>FacilityQueueMetrics는 실제 관측 구간이고, 이 객체는 그 큐에 적용할 조건이다.
 * 같은 관측값에 운영시설 8개, 10개 등의 조건을 각각 적용할 수 있다.
 * 모든 인원·시간은 Metrics와 동일한 큐 및 동일한 구간 기준으로 전달해야 한다.</p>
 *
 * <p>가정 플래그의 기본값은 모두 false이다. 데이터가 있다는 이유만으로 M/M/s나
 * Little's Law가 자동 성립하지 않으므로, 호출자가 적용 가능성을 확인한 경우만 true로 만든다.
 * 기본 관측량의 단위 변환은 이런 모형 플래그 없이 계산할 수 있다.</p>
 */
public final class FacilityQueueContext {
    /** 현재 이 큐에 배정되어 운영하는 처리시설 수 s. 다른 큐 전용 시설은 포함하지 않는다. */
    private final Integer oprServerCnt;

    /** 이 큐에 배정 가능한 최대 시설 수. 공항 전체의 보유 대수가 아니다. */
    private final Integer totServerCnt;

    /** 별도로 확보한 유입률 lambda(명/시간). null이면 명시적으로 허용된 경우에만 Little's Law로 추정한다. */
    private final Double arrivalRatePerHour;

    /** 별도 유입률도 추정값이면 true. false이면 관측량에서 계산한 유입률이라는 호출자 선언이다. */
    private final boolean arrivalRateEstimated;

    /** 동일 구간에 큐를 떠나 서비스를 시작한 인원. 처리를 완료한 인원과 다르다. */
    private final Integer serviceStartPsgCnt;

    /** 동일 구간에 처리를 완료한 인원. 실제 통과율 계산에만 사용한다. */
    private final Integer prcsPsgCnt;

    /** 관측 구간 시작 시점의 대기인원. 종료 스냅샷과 비교해 순변화를 구한다. */
    private final Integer queuePsgCntAtStart;

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

    private FacilityQueueContext(Builder builder) {
        QueueInputValidation.nonNegative(builder.oprServerCnt, "oprServerCnt");
        QueueInputValidation.nonNegative(builder.totServerCnt, "totServerCnt");
        QueueInputValidation.nonNegative(builder.arrivalRatePerHour, "arrivalRatePerHour");
        QueueInputValidation.nonNegative(builder.serviceStartPsgCnt, "serviceStartPsgCnt");
        QueueInputValidation.nonNegative(builder.prcsPsgCnt, "prcsPsgCnt");
        QueueInputValidation.nonNegative(builder.queuePsgCntAtStart, "queuePsgCntAtStart");
        QueueInputValidation.nonNegative(builder.busyServerTimeSec, "busyServerTimeSec");
        QueueInputValidation.nonNegative(builder.availableServerTimeSec, "availableServerTimeSec");
        if (builder.oprServerCnt != null && builder.totServerCnt != null
                && builder.oprServerCnt > builder.totServerCnt) {
            throw new IllegalArgumentException("oprServerCnt must not exceed totServerCnt");
        }
        if (builder.busyServerTimeSec != null && builder.availableServerTimeSec != null
                && builder.busyServerTimeSec > builder.availableServerTimeSec) {
            throw new IllegalArgumentException("busyServerTimeSec must not exceed availableServerTimeSec");
        }
        this.oprServerCnt = builder.oprServerCnt;
        this.totServerCnt = builder.totServerCnt;
        this.arrivalRatePerHour = builder.arrivalRatePerHour;
        this.arrivalRateEstimated = builder.arrivalRateEstimated;
        this.serviceStartPsgCnt = builder.serviceStartPsgCnt;
        this.prcsPsgCnt = builder.prcsPsgCnt;
        this.queuePsgCntAtStart = builder.queuePsgCntAtStart;
        this.busyServerTimeSec = builder.busyServerTimeSec;
        this.availableServerTimeSec = builder.availableServerTimeSec;
        this.littleLawApplicable = builder.littleLawApplicable;
        this.sharedHomogeneousServers = builder.sharedHomogeneousServers;
        this.constantRates = builder.constantRates;
        this.noAbandonmentOrTransfers = builder.noAbandonmentOrTransfers;
        this.mmSApplicable = builder.mmSApplicable;
    }

    /** 미제공 관측값은 null, 분석 가정은 false인 상태에서 시작한다. */
    public static Builder builder() { return new Builder(); }

    /** 현재 이 큐에 배정되어 운영하는 처리시설 수 s. 다른 큐 전용 시설은 포함하지 않는다. */
    public Integer getOprServerCnt() { return oprServerCnt; }

    /** 이 큐에 배정 가능한 최대 시설 수. 공항 전체의 보유 대수가 아니다. */
    public Integer getTotServerCnt() { return totServerCnt; }

    /** 별도로 확보한 유입률 lambda(명/시간). null이면 명시적으로 허용된 경우에만 Little's Law로 추정한다. */
    public Double getArrivalRatePerHour() { return arrivalRatePerHour; }

    /** 별도 유입률도 추정값이면 true. false이면 관측량에서 계산한 유입률이라는 호출자 선언이다. */
    public boolean isArrivalRateEstimated() { return arrivalRateEstimated; }

    /** 동일 구간에 큐를 떠나 서비스를 시작한 인원. 처리를 완료한 인원과 다르다. */
    public Integer getServiceStartPsgCnt() { return serviceStartPsgCnt; }

    /** 동일 구간에 처리를 완료한 인원. 실제 통과율 계산에만 사용한다. */
    public Integer getPrcsPsgCnt() { return prcsPsgCnt; }

    /** 관측 구간 시작 시점의 대기인원. 종료 스냅샷과 비교해 순변화를 구한다. */
    public Integer getQueuePsgCntAtStart() { return queuePsgCntAtStart; }

    /** 모든 처리시설의 실제 처리 중 시간을 합한 값(시설·초). 예: 2개가 각각 300초 처리하면 600이다. */
    public Double getBusyServerTimeSec() { return busyServerTimeSec; }

    /** 모든 처리시설의 운영 가능 시간을 합한 값(시설·초). 휴게·중간 개폐를 반영한다. */
    public Double getAvailableServerTimeSec() { return availableServerTimeSec; }

    /** 시간평균 큐 인원과 여객평균 대기시간의 범위가 대응하고 구간 경계 효과가 충분히 작다고 확인했는지 여부. */
    public boolean isLittleLawApplicable() { return littleLawApplicable; }

    /** 이 큐의 여객이 모든 대상 시설을 이용할 수 있고 시설별 평균 처리율이 동등하다고 확인했는지 여부. */
    public boolean isSharedHomogeneousServers() { return sharedHomogeneousServers; }

    /** 예측 구간 동안 유입률·처리율·운영 시설 수가 유지된다고 가정할 수 있는지 여부. */
    public boolean isConstantRates() { return constantRates; }

    /** 큐 이탈, 다른 큐로 이동, 측정영역 재설정이 없다고 확인했는지 여부. 인원 보존식에 필요하다. */
    public boolean isNoAbandonmentOrTransfers() { return noAbandonmentOrTransfers; }

    /** 포아송 도착·독립 지수 처리시간·선착순 처리·무한 대기공간 등 M/M/s 가정을 확인했는지 여부. */
    public boolean isMmSApplicable() { return mmSApplicable; }

    /** 여러 선택 입력을 생성자 인수 순서로 혼동하지 않도록 이름을 지정해 구성한다. */
    public static final class Builder {
        private Integer oprServerCnt;
        private Integer totServerCnt;
        private Double arrivalRatePerHour;
        private boolean arrivalRateEstimated;
        private Integer serviceStartPsgCnt;
        private Integer prcsPsgCnt;
        private Integer queuePsgCntAtStart;
        private Double busyServerTimeSec;
        private Double availableServerTimeSec;
        private boolean littleLawApplicable;
        private boolean sharedHomogeneousServers;
        private boolean constantRates;
        private boolean noAbandonmentOrTransfers;
        private boolean mmSApplicable;

        private Builder() { }

        /** 현재 이 큐에 배정되어 운영하는 처리시설 수 s. 다른 큐 전용 시설은 포함하지 않는다. */
        public Builder oprServerCnt(Integer value) { this.oprServerCnt = value; return this; }

        /** 이 큐에 배정 가능한 최대 시설 수. 공항 전체의 보유 대수가 아니다. */
        public Builder totServerCnt(Integer value) { this.totServerCnt = value; return this; }

        /** 별도로 확보한 유입률 lambda(명/시간). null이면 명시적으로 허용된 경우에만 Little's Law로 추정한다. */
        public Builder arrivalRatePerHour(Double value) { this.arrivalRatePerHour = value; return this; }

        /** 별도 유입률도 추정값이면 true. false이면 관측량에서 계산한 유입률이라는 호출자 선언이다. */
        public Builder arrivalRateEstimated(boolean value) { this.arrivalRateEstimated = value; return this; }

        /** 동일 구간에 큐를 떠나 서비스를 시작한 인원. 처리를 완료한 인원과 다르다. */
        public Builder serviceStartPsgCnt(Integer value) { this.serviceStartPsgCnt = value; return this; }

        /** 동일 구간에 처리를 완료한 인원. 실제 통과율 계산에만 사용한다. */
        public Builder prcsPsgCnt(Integer value) { this.prcsPsgCnt = value; return this; }

        /** 관측 구간 시작 시점의 대기인원. 종료 스냅샷과 비교해 순변화를 구한다. */
        public Builder queuePsgCntAtStart(Integer value) { this.queuePsgCntAtStart = value; return this; }

        /** 모든 처리시설의 실제 처리 중 시간을 합한 값(시설·초). 예: 2개가 각각 300초 처리하면 600이다. */
        public Builder busyServerTimeSec(Double value) { this.busyServerTimeSec = value; return this; }

        /** 모든 처리시설의 운영 가능 시간을 합한 값(시설·초). 휴게·중간 개폐를 반영한다. */
        public Builder availableServerTimeSec(Double value) { this.availableServerTimeSec = value; return this; }

        /** 시간평균 큐 인원과 여객평균 대기시간의 범위가 대응하고 구간 경계 효과가 충분히 작다고 확인했는지 여부. */
        public Builder littleLawApplicable(boolean value) { this.littleLawApplicable = value; return this; }

        /** 이 큐의 여객이 모든 대상 시설을 이용할 수 있고 시설별 평균 처리율이 동등하다고 확인했는지 여부. */
        public Builder sharedHomogeneousServers(boolean value) { this.sharedHomogeneousServers = value; return this; }

        /** 예측 구간 동안 유입률·처리율·운영 시설 수가 유지된다고 가정할 수 있는지 여부. */
        public Builder constantRates(boolean value) { this.constantRates = value; return this; }

        /** 큐 이탈, 다른 큐로 이동, 측정영역 재설정이 없다고 확인했는지 여부. 인원 보존식에 필요하다. */
        public Builder noAbandonmentOrTransfers(boolean value) { this.noAbandonmentOrTransfers = value; return this; }

        /** 포아송 도착·독립 지수 처리시간·선착순 처리·무한 대기공간 등 M/M/s 가정을 확인했는지 여부. */
        public Builder mmSApplicable(boolean value) { this.mmSApplicable = value; return this; }

        /** 음수·비유한 값·운영 수 초과·처리 중 시간 초과를 검증한 뒤 불변 객체를 만든다. */
        public FacilityQueueContext build() { return new FacilityQueueContext(this); }
    }
}
