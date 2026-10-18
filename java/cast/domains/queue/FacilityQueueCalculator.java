package aoms.pm.cast.domains.queue;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 특정 시설의 큐 한 개와 그 큐를 처리하는 시설 그룹에 대한 구간별 분석 객체
 */
public final class FacilityQueueCalculator {
    private static final double SECONDS_PER_HOUR = 3600.0;
    private final String tmnlId;
    private final String fcltType;
    private final String fcltId;
    private final String queueId;
    private final LocalDateTime intervalStart;
    private final LocalDateTime intervalEnd;
    private final QueueDataSource source;
    private final Double avgPrcsTimeSec;
    private final Double avgWtngTimeSec;
    private final Double avgQueuePsgCnt;
    private final Integer queuePsgCntAtEnd;

    private FacilityQueueCalculator(Builder builder) {
        QueueInputValidation.requiredText(builder.tmnlId, "tmnlId");
        QueueInputValidation.requiredText(builder.fcltType, "fcltType");
        QueueInputValidation.requiredText(builder.fcltId, "fcltId");
        QueueInputValidation.requiredText(builder.queueId, "queueId");
        Objects.requireNonNull(builder.intervalStart, "intervalStart");
        Objects.requireNonNull(builder.source, "source");
        LocalDateTime end = builder.intervalEnd == null ? builder.intervalStart.plusMinutes(10) : builder.intervalEnd;
        
        if (!end.isAfter(builder.intervalStart)) {
            throw new IllegalArgumentException("종료 시각은 시작 시각보다 뒤여야 합니다.");
        }

        QueueInputValidation.nonNegative(builder.avgPrcsTimeSec, "avgPrcsTimeSec");
        QueueInputValidation.nonNegative(builder.avgWtngTimeSec, "avgWtngTimeSec");
        QueueInputValidation.nonNegative(builder.avgQueuePsgCnt, "avgQueuePsgCnt");
        QueueInputValidation.nonNegative(builder.queuePsgCntAtEnd, "queuePsgCntAtEnd");
        
        this.tmnlId = builder.tmnlId;
        this.fcltType = builder.fcltType;
        this.fcltId = builder.fcltId;
        this.queueId = builder.queueId;
        this.intervalStart = builder.intervalStart;
        this.intervalEnd = end;
        this.source = builder.source;
        this.avgPrcsTimeSec = builder.avgPrcsTimeSec;
        this.avgWtngTimeSec = builder.avgWtngTimeSec;
        this.avgQueuePsgCnt = builder.avgQueuePsgCnt;
        this.queuePsgCntAtEnd = builder.queuePsgCntAtEnd;
    }

    public static Builder builder() { return new Builder(); }

    public double getIntervalSeconds() {
        Duration duration = Duration.between(intervalStart, intervalEnd);
        return duration.getSeconds() + duration.getNano() / 1_000_000_000.0;
    }

    /**
     * 단일 시설의 대표 처리율 mu = 3600/S(명/시간).
     * 한 시설이 한 번에 한 명씩 연속 처리할 때의 평균 처리능력 추정이며 실제 통과율이 아니다.
     * 시설별 속도가 다르면 전체 평균의 역수에 시설 수를 곱해 정밀 용량을 구할 수 없다.
     */
    public Computed<Double> estimateServiceRatePerHour() {
        if (avgPrcsTimeSec == null || avgPrcsTimeSec == 0) {
            return Computed.unavailable(CalculationMethod.SERVICE_TIME, "양수인 단일 시설 평균 처리시간이 필요합니다.");
        }
        return number(SECONDS_PER_HOUR / avgPrcsTimeSec, true, CalculationMethod.SERVICE_TIME,
                "한 시설이 한 번에 한 명을 연속 처리한다고 가정한 3600 / 평균 처리시간");
    }

    /**
     * 별도 유입률이 있으면 그 값을 우선 사용한다. 없으면 Lq=lambda*Wq를 역산한다.
     * lambda = 3600*Lq/Wq(명/시간). 시간평균 큐 인원과 대응하는 여객평균 대기시간이 필요하다.
     * 짧은 구간의 초기·말기 잔여 여객이나 급격한 혼잡 변화 때문에 이 관계가 맞지 않을 수 있다.
     * Wq=0이면 Lq도 0이더라도 0/0이라 유입률을 알 수 없으며 0명/시간으로 단정하지 않는다.
     */
    public Computed<Double> estimateArrivalRatePerHour(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (input.getArrivalRatePerHour() != null) {
            return number(input.getArrivalRatePerHour(), input.isArrivalRateEstimated(),
                    CalculationMethod.EXTERNAL_INPUT, "호출자가 별도로 제공한 유입률(명/시간)");
        }
        if (!input.isLittleLawApplicable()) {
            return Computed.unavailable(CalculationMethod.LITTLE_LAW,
                    "별도 유입률이 없고 Little's Law 적용 가능성도 확인되지 않았습니다.");
        }
        if (avgQueuePsgCnt == null || avgWtngTimeSec == null || avgWtngTimeSec == 0) {
            return Computed.unavailable(CalculationMethod.LITTLE_LAW,
                    "시간평균 대기인원과 양수인 평균 대기시간이 필요합니다. 종료 스냅샷은 사용할 수 없습니다.");
        }
        return number(avgQueuePsgCnt / avgWtngTimeSec * SECONDS_PER_HOUR, true,
                CalculationMethod.LITTLE_LAW, "Little's Law 적용 가능성을 확인한 Lq / Wq × 3600 추정");
    }

    /**
     * 동일 속도의 시설 s개가 같은 큐를 자유롭게 처리할 때의 총 처리능력 C=s*mu(명/시간).
     * 시설 간 항공사·등급 제약이 있으면 해당 큐가 실제로 사용할 수 있는 시설만 세어야 한다.
     * 운영 수가 0이면 처리능력도 0이며 이 경우 평균 처리시간은 필요하지 않다.
     */
    public Computed<Double> estimateCapacityPerHour(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (input.getOprServerCnt() == null) {
            return Computed.unavailable(CalculationMethod.SERVICE_CAPACITY, "운영 처리시설 수가 없습니다.");
        }
        if (input.getOprServerCnt() == 0) {
            return number(0, false, CalculationMethod.SERVICE_CAPACITY, "운영 처리시설이 0개이므로 처리능력도 0입니다.");
        }
        if (!input.isSharedHomogeneousServers()) {
            return Computed.unavailable(CalculationMethod.SERVICE_CAPACITY, "동일 속도의 공용 처리시설 그룹인지 확인되지 않았습니다.");
        }
        Computed<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) return failure(service, CalculationMethod.SERVICE_CAPACITY);
        return number(input.getOprServerCnt() * service.getValue(), true, CalculationMethod.SERVICE_CAPACITY,
                "동일 속도의 공용 처리시설 수 × 대표 처리율(명/시간)");
    }

    /**
     * 유입 부하 rho=lambda/C. 1 이상이면 처리능력 이상의 유입이라는 뜻이다.
     * 실제 가동률이 아니므로 1 초과 값을 1로 잘라내지 않는다. C=0이면 유한 비율을 정의하지 않는다.
     */
    public Computed<Double> estimateLoadRatio(FacilityQueueInput input) {
        Computed<Double> capacity = estimateCapacityPerHour(input);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.SERVICE_CAPACITY);
        if (capacity.getValue() == 0) {
            return Computed.unavailable(CalculationMethod.SERVICE_CAPACITY, "처리능력이 0이라 유한한 부하율을 정의할 수 없습니다.");
        }
        Computed<Double> arrival = estimateArrivalRatePerHour(input);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.SERVICE_CAPACITY);
        return number(arrival.getValue() / capacity.getValue(), true, CalculationMethod.SERVICE_CAPACITY,
                "유입률 / 처리능력. 1 초과는 과부하이며 실제 가동률이 아닙니다. 유입 근거: " + arrival.getMethod());
    }

    /**
     * 순감소 능력 C-lambda(명/시간). 양수는 대기 감소, 0은 유지, 음수는 증가 방향이다.
     * 이는 여객이 충분히 있고 현재 조건이 유지될 때의 잠재적 감소율이다.
     * 큐가 비어 있는 동안에도 이 속도로 계속 인원이 감소한다는 의미는 아니다.
     */
    public Computed<Double> estimateNetDrainRatePerHour(FacilityQueueInput input) {
        Computed<Double> capacity = estimateCapacityPerHour(input);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.FLOW_BALANCE);
        Computed<Double> arrival = estimateArrivalRatePerHour(input);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.FLOW_BALANCE);
        return number(capacity.getValue() - arrival.getValue(), true, CalculationMethod.FLOW_BALANCE,
                "처리능력 - 유입률(명/시간). 유입 근거: " + arrival.getMethod());
    }

    /**
     * 현재 종료 스냅샷 Q에서 목표 인원까지 감소하는 시간(초)을 유입/처리 차이 계산한다.
     * t=max(0,Q-target)/(C-lambda)*3600. 조건이 미래에도 일정해야 한다.
     * 이미 목표 이하이면 0초, 목표 초과인데 {@code C <= lambda}이면 현재 조건으로는 달성 불가이다.
     * 현재 여객 한 명의 평균 대기시간이나 실제 해소시각을 이 식으로 확정할 수는 없다.
     */
    public Computed<Double> estimateClearTimeSec(FacilityQueueInput input, int targetQueueCnt) {
        Objects.requireNonNull(input, "input");
        QueueInputValidation.nonNegative(Integer.valueOf(targetQueueCnt), "targetQueueCnt");
        if (queuePsgCntAtEnd == null) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "종료 시점 대기인원이 없습니다.");
        }
        if (queuePsgCntAtEnd <= targetQueueCnt) {
            return number(0, false, CalculationMethod.DIRECT, "종료 시점 대기인원이 이미 목표 이하입니다.");
        }
        if (!input.isConstantRates()) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "예측 구간의 유입률·처리율·운영 수 유지 가정이 필요합니다.");
        }
        Computed<Double> drain = estimateNetDrainRatePerHour(input);
        if (!drain.hasValue()) return failure(drain, CalculationMethod.FLOW_BALANCE);
        if (drain.getValue() <= 0) {
            return Computed.unreachable(CalculationMethod.FLOW_BALANCE, "처리능력이 유입률 이하라 현재 조건으로 목표까지 감소하지 않습니다.");
        }
        return number((queuePsgCntAtEnd - (double) targetQueueCnt) / drain.getValue() * SECONDS_PER_HOUR,
                true, CalculationMethod.FLOW_BALANCE, "현재 대기인원에서 목표까지 유입률·처리능력이 일정한 유입/처리 차이 계산");
    }

    /**
     * 종료 스냅샷 시각에 줄 끝에 선 여객의 예상 대기시간 (Q+1)/C*3600(초).
     * 공용 FIFO 큐에서는 앞사람 Q명이 모두 서비스에 들어간 뒤 시설 하나가 더 비어야 차례가 온다.
     * 이후 유입은 뒤에 서므로 lambda와 무관하고 rho >= 1에서도 정의된다. 지수 처리시간이면 정확한 기대값이다.
     * Q=0이면 빈 시설이 있다고 보고 0초다. 모든 시설이 처리 중이었다면 최대 1/C만큼 과소평가한다.
     */
    public Computed<Double> estimateNextArrivalWaitSec(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (queuePsgCntAtEnd == null) {
            return Computed.unavailable(CalculationMethod.NEXT_ARRIVAL_WAIT, "종료 시점 대기인원이 없습니다.");
        }
        if (!input.isConstantRates()) {
            return Computed.unavailable(CalculationMethod.NEXT_ARRIVAL_WAIT, "대기하는 동안 처리율·운영 수가 유지된다는 가정이 필요합니다.");
        }
        Computed<Double> capacity = estimateCapacityPerHour(input);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.NEXT_ARRIVAL_WAIT);
        if (capacity.getValue() == 0) {
            return Computed.unreachable(CalculationMethod.NEXT_ARRIVAL_WAIT, "운영 처리시설이 0개라 대기가 끝나지 않습니다.");
        }
        if (queuePsgCntAtEnd == 0) {
            return number(0, false, CalculationMethod.NEXT_ARRIVAL_WAIT, "대기열이 비어 있어 바로 처리를 시작한다고 봅니다.");
        }
        return number((queuePsgCntAtEnd + 1.0) / capacity.getValue() * SECONDS_PER_HOUR, true,
                CalculationMethod.NEXT_ARRIVAL_WAIT, "(종료 시점 대기인원 + 1) / 총 처리능력 × 3600. 이후 유입과 무관");
    }

    /**
     * 목표시간 T초 안에 목표 대기인원까지 줄이는 데 필요한 총 처리시설 수를 구한다.
     * required=ceil((lambda+max(0,Q-target)*3600/T)/mu).
     * 추가 수가 아니라 현재 운영분을 포함한 총 수이다. 0.2개 시설은 운영할 수 없어 올림한다.
     * 보유 수를 초과해도 필요한 수는 그대로 반환하고, 실현 가능성은 호출자가 보유 수와 비교해 판단한다.
     * 이미 목표 이하이어도 신규 유입을 감당할 용량을 유지한다는 정책으로 계산한다.
     * 이론 최소량이며 변동성·안전 여유·SLA를 보장하는 Erlang C 인력 산정과는 다르다.
     */
    public Computed<Integer> estimateRequiredServerCnt(
            FacilityQueueInput input, int targetQueueCnt, double targetTimeSec) {
        Objects.requireNonNull(input, "input");
        QueueInputValidation.nonNegative(Integer.valueOf(targetQueueCnt), "targetQueueCnt");
        QueueInputValidation.positive(targetTimeSec, "targetTimeSec");
        if (queuePsgCntAtEnd == null) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "종료 시점 대기인원이 없습니다.");
        }
        if (!input.isConstantRates() || !input.isSharedHomogeneousServers()) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "일정한 유입률과 동일 속도의 공용 처리시설 가정이 필요합니다.");
        }
        Computed<Double> arrival = estimateArrivalRatePerHour(input);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.FLOW_BALANCE);
        double excess = Math.max(0, queuePsgCntAtEnd - (double) targetQueueCnt);
        double requiredRate = arrival.getValue() + excess / targetTimeSec * SECONDS_PER_HOUR;
        if (requiredRate == 0) {
            return Computed.calculated(0, CalculationMethod.FLOW_BALANCE, "잔여 초과 대기와 신규 유입이 모두 0입니다.");
        }
        Computed<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) return failure(service, CalculationMethod.FLOW_BALANCE);
        // 양수 수요를 양수 처리율로 나눈 값이 극소수 언더플로로 0이 되어도 최소 1개는 필요하다.
        double required = Math.max(1.0, Math.ceil(requiredRate / service.getValue()));
        if (!Double.isFinite(required) || required > Integer.MAX_VALUE) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "필요 시설 수가 표현 가능한 정수 범위를 초과합니다.");
        }
        return Computed.estimated((int) required, CalculationMethod.FLOW_BALANCE,
                "현재 운영분을 포함한 총 소요 수. 보유 한도·변동성·SLA는 별도 검토해야 합니다.");
    }

    /** 구간 완료인원/구간초*3600. 실제 관측 통과율이며 잠재 처리능력을 뜻하지 않는다. */
    public Computed<Double> getObservedThroughputPerHour(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (input.getPrcsPsgCnt() == null) {
            return Computed.unavailable(CalculationMethod.OBSERVED_FLOW, "구간 처리 완료인원이 없습니다.");
        }
        return number(input.getPrcsPsgCnt() / getIntervalSeconds() * SECONDS_PER_HOUR,
                false, CalculationMethod.OBSERVED_FLOW, "동일 구간 처리 완료인원 / 구간초 × 3600(명/시간)");
    }

    /**
     * 인원 보존식 A=Q_end-Q_start+서비스 시작인원으로 구간 유입인원을 역산한다.
     * 큐 이탈·이동이 없는 동일 경계 기준이 필요하다. 완료인원은 이 식에 바로 넣지 않는다.
     * 결과가 음수이면 측정 범위·시각·누계 여부가 맞지 않는 것이므로 0으로 덮지 않는다.
     */
    public Computed<Integer> estimateArrivalPsgCnt(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (!input.isNoAbandonmentOrTransfers()) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, "큐 이탈·다른 큐 이동·측정영역 변경이 없다는 확인이 필요합니다.");
        }
        if (queuePsgCntAtEnd == null || input.getQueuePsgCntAtStart() == null
                || input.getWtngEndPsgCnt() == null) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, "시작·종료 대기인원과 서비스 시작인원이 필요합니다.");
        }
        long arrivals = (long) queuePsgCntAtEnd - input.getQueuePsgCntAtStart() + input.getWtngEndPsgCnt();
        if (arrivals < 0 || arrivals > Integer.MAX_VALUE) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, "역산 유입인원이 음수이거나 정수 범위를 초과합니다. 원천과 경계를 확인해야 합니다.");
        }
        return Computed.calculated((int) arrivals, CalculationMethod.QUEUE_BALANCE,
                "큐 이탈·이동이 없는 경우의 종료인원 - 시작인원 + 서비스 시작인원");
    }

    /** 보존식 유입인원 / 구간초 × 3600(명/시간). 유입인원을 구할 수 없으면 그 사유를 그대로 전달한다. */
    public Computed<Double> estimateArrivalRateByQueueBalance(FacilityQueueInput input) {
        Computed<Integer> arrivals = estimateArrivalPsgCnt(input);
        if (!arrivals.hasValue()) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, arrivals.getReason());
        }
        return number(arrivals.getValue() / getIntervalSeconds() * SECONDS_PER_HOUR, true,
                CalculationMethod.QUEUE_BALANCE, "관측구간 보존식 유입인원 " + arrivals.getValue() + "명 / 구간초 × 3600 (명/시간)");
    }

    /**
     * M/M/s 정상상태의 대기확률 C, 평균 대기시간/대기인원을 산출한다.
     * B_0 = 1
     * B_n = a * B_(n-1) / (n + a * B_(n-1))
     * C= B_s / ( 1 - rho + rho*B_s )
     * rho = lambda / (s*mu)
     */
    public Computed<ErlangCResult> analyzeErlangC(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (!input.isMmSApplicable() || !input.isConstantRates() || !input.isSharedHomogeneousServers()) {
            return Computed.unavailable(CalculationMethod.ERLANG_C, "M/M/s 가정과 일정한 유입률·동일 속도 공용 처리시설 가정 확인이 필요합니다.");
        }

        Computed<Double> capacity = estimateCapacityPerHour(input);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.ERLANG_C);
        
        if (capacity.getValue() == 0) {
            return Computed.unavailable(CalculationMethod.ERLANG_C, "M/M/s에는 양수인 운영 수와 처리율이 필요합니다.");
        }
        
        // 람다 - 유입률
        Computed<Double> arrival = estimateArrivalRatePerHour(input);
        
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.ERLANG_C);
        
        // 뮤 - 시설 하나의 처리율
        Computed<Double> service = estimateServiceRatePerHour();
        
        if (!service.hasValue()) return failure(service, CalculationMethod.ERLANG_C);
        
        // 처리 여유 용량
        double spareCapacity = capacity.getValue() - arrival.getValue();
        if (spareCapacity <= 0) {
            return Computed.unavailable(CalculationMethod.ERLANG_C, "유입률이 총 처리능력 이상이라 유한한 정상상태 대기값이 없습니다.");
        }
        
        // 부하율
        double load = arrival.getValue() / capacity.getValue();
        // Erlang
        double offeredLoad = arrival.getValue() / service.getValue();
        double erlangB = 1.0;
        
        for (int index = 0; index < input.getOprServerCnt(); index++) {
            double weighted = offeredLoad * erlangB;
            erlangB = weighted / (index + 1.0 + weighted);
        }
        
        // 대기확률 (C)
        double waitProbability = erlangB / (1.0 - load + load * erlangB);
        // 평균 대기시간
        double avgWaitSec = waitProbability / spareCapacity * SECONDS_PER_HOUR;
        // 평균 대기인원
        double avgQueue = arrival.getValue() / SECONDS_PER_HOUR * avgWaitSec;
        
        if (!Double.isFinite(avgWaitSec) || !Double.isFinite(avgQueue)) {
            return Computed.unavailable(CalculationMethod.ERLANG_C, "정상상태 값이 수치 표현 범위를 초과합니다.");
        }
        
        ErlangCResult result = new ErlangCResult(
            load,
            waitProbability,
            avgWaitSec,
            avgQueue
        );
        
        return Computed.estimated(
            result, 
            CalculationMethod.ERLANG_C,
            "M/M/s 정상상태 모형값. 유입 근거: " + arrival.getMethod()
        );
    }

    /** 0 나눗셈은 각 메서드에서 처리하고, 최종 산술 오버플로는 잘못된 숫자 대신 산출 불가로 바꾼다. */
    private static Computed<Double> number(double value, boolean estimated,
            CalculationMethod method, String reason) {
        if (!Double.isFinite(value)) {
            return Computed.unavailable(method, "계산값이 유한한 수치 표현 범위를 벗어났습니다.");
        }
        return estimated ? Computed.estimated(value, method, reason)
                : Computed.calculated(value, method, reason);
    }

    /** 선행 계산 실패의 사유를 보존한다. 실패를 기본값 0으로 바꿔 후속 계산을 계속하지 않는다. */
    private static <T> Computed<T> failure(Computed<?> cause, CalculationMethod method) {
        return cause.getStatus() == CalcOutcome.UNREACHABLE
                ? Computed.unreachable(method, cause.getReason())
                : Computed.unavailable(method, cause.getReason());
    }

    public static final class Builder {
        private String tmnlId;
        private String fcltType;
        private String fcltId;
        private String queueId;
        private LocalDateTime intervalStart;
        private LocalDateTime intervalEnd;
        private QueueDataSource source;
        private Double avgPrcsTimeSec;
        private Double avgWtngTimeSec;
        private Double avgQueuePsgCnt;
        private Integer queuePsgCntAtEnd;
        private Builder() { }
        public Builder tmnlId(String value) { this.tmnlId = value; return this; }
        public Builder fcltType(String value) { this.fcltType = value; return this; }
        public Builder fcltId(String value) { this.fcltId = value; return this; }
        public Builder queueId(String value) { this.queueId = value; return this; }
        public Builder intervalStart(LocalDateTime value) { this.intervalStart = value; return this; }
        public Builder intervalEnd(LocalDateTime value) { this.intervalEnd = value; return this; }
        public Builder source(QueueDataSource value) { this.source = value; return this; }
        public Builder avgPrcsTimeSec(Double value) { this.avgPrcsTimeSec = value; return this; }
        public Builder avgWtngTimeSec(Double value) { this.avgWtngTimeSec = value; return this; }
        public Builder avgQueuePsgCnt(Double value) { this.avgQueuePsgCnt = value; return this; }
        public Builder queuePsgCntAtEnd(Integer value) { this.queuePsgCntAtEnd = value; return this; }
        public FacilityQueueCalculator build() { return new FacilityQueueCalculator(this); }
    }
}
