package aoms.pm.cast.domains.queue;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 특정 시설의 큐 한 개와 그 큐를 처리하는 시설 그룹에 대한 구간별 분석 객체
 */
public final class FacilityQueueCalculator {
    private static final double SECONDS_PER_HOUR = 3600.0;
    private final LocalDateTime intervalStart;
    private final LocalDateTime intervalEnd;
    private final Double avgPrcsTimeSec;
    private final Double avgWtngTimeSec;
    private final Double avgQueuePsgCnt;
    private final Integer queuePsgCntAtEnd;

    @lombok.Builder(builderClassName = "Builder")
    private FacilityQueueCalculator(
            String tmnlId, String fcltType, String fcltId, String queueId,
            LocalDateTime intervalStart, LocalDateTime intervalEnd, QueueDataSource source,
            Double avgPrcsTimeSec, Double avgWtngTimeSec, Double avgQueuePsgCnt,
            Integer queuePsgCntAtEnd
    ) {
        QueueInputValidation.requiredText(tmnlId, "tmnlId");
        QueueInputValidation.requiredText(fcltType, "fcltType");
        QueueInputValidation.requiredText(fcltId, "fcltId");
        QueueInputValidation.requiredText(queueId, "queueId");
        Objects.requireNonNull(intervalStart, "intervalStart");
        Objects.requireNonNull(source, "source");
        LocalDateTime end = intervalEnd == null ? intervalStart.plusMinutes(10) : intervalEnd;

        QueueInputValidation.nonNegative(avgPrcsTimeSec, "avgPrcsTimeSec");
        QueueInputValidation.nonNegative(avgWtngTimeSec, "avgWtngTimeSec");
        QueueInputValidation.nonNegative(avgQueuePsgCnt, "avgQueuePsgCnt");
        QueueInputValidation.nonNegative(queuePsgCntAtEnd, "queuePsgCntAtEnd");

        this.intervalStart = intervalStart;
        this.intervalEnd = end;
        this.avgPrcsTimeSec = avgPrcsTimeSec;
        this.avgWtngTimeSec = avgWtngTimeSec;
        this.avgQueuePsgCnt = avgQueuePsgCnt;
        this.queuePsgCntAtEnd = queuePsgCntAtEnd;
    }

    public double getIntervalSeconds() {
        Duration duration = Duration.between(intervalStart, intervalEnd);
        return duration.getSeconds() + duration.getNano() / 1_000_000_000.0;
    }

    // 단일 시설의 대표 처리율 mu = 3600/S(명/시간)
    public Computed<Double> estimateServiceRatePerHour() {
        if (avgPrcsTimeSec == null || avgPrcsTimeSec == 0) {
            return Computed.unavailable(CalculationMethod.SERVICE_TIME, "양수인 단일 시설 평균 처리시간이 필요합니다.");
        }
        return number(SECONDS_PER_HOUR / avgPrcsTimeSec, true, CalculationMethod.SERVICE_TIME,
                "한 시설이 한 번에 한 명을 연속 처리한다고 가정한 3600 / 평균 처리시간");
    }

    // 유입률 lambda(명/시간). 별도 입력을 우선 쓰고 없으면 Little's Law(3600*Lq/Wq)로 역산한다.
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

    // 총 처리능력 C = s*mu(명/시간)
    public Computed<Double> estimateCapacityPerHour(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (input.getOprServerCnt() == null) {
            return Computed.unavailable(CalculationMethod.SERVICE_CAPACITY, "운영 처리시설 수가 없습니다.");
        }
        if (input.getOprServerCnt() == 0) {
            return number(0, false, CalculationMethod.SERVICE_CAPACITY, "운영 처리시설이 0개이므로 처리능력도 0입니다.");
        }
        Computed<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) return failure(service, CalculationMethod.SERVICE_CAPACITY);
        return number(input.getOprServerCnt() * service.getValue(), true, CalculationMethod.SERVICE_CAPACITY,
                "동일 속도의 공용 처리시설 수 × 대표 처리율(명/시간)");
    }

    // 유입 부하율 rho = lambda/C
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

    // 순감소 능력 C-lambda(명/시간). 양수면 대기 감소, 음수면 증가 방향이다.
    public Computed<Double> estimateNetDrainRatePerHour(FacilityQueueInput input) {
        Computed<Double> capacity = estimateCapacityPerHour(input);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.FLOW_BALANCE);
        Computed<Double> arrival = estimateArrivalRatePerHour(input);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.FLOW_BALANCE);
        return number(capacity.getValue() - arrival.getValue(), true, CalculationMethod.FLOW_BALANCE,
                "처리능력 - 유입률(명/시간). 유입 근거: " + arrival.getMethod());
    }

    // 종료 시점 대기인원 Q가 목표 인원까지 줄어드는 시간(초) = (Q-target)/(C-lambda)*3600.
    public Computed<Double> estimateClearTimeSec(FacilityQueueInput input, int targetQueueCnt) {
        Objects.requireNonNull(input, "input");
        QueueInputValidation.nonNegative(targetQueueCnt, "targetQueueCnt");
        if (queuePsgCntAtEnd == null) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "종료 시점 대기인원이 없습니다.");
        }
        if (queuePsgCntAtEnd <= targetQueueCnt) {
            return number(0, false, CalculationMethod.DIRECT, "종료 시점 대기인원이 이미 목표 이하입니다.");
        }
        Computed<Double> drain = estimateNetDrainRatePerHour(input);
        if (!drain.hasValue()) return failure(drain, CalculationMethod.FLOW_BALANCE);
        if (drain.getValue() <= 0) {
            return Computed.unreachable(CalculationMethod.FLOW_BALANCE, "처리능력이 유입률 이하라 현재 조건으로 목표까지 감소하지 않습니다.");
        }
        return number((queuePsgCntAtEnd - (double) targetQueueCnt) / drain.getValue() * SECONDS_PER_HOUR,
                true, CalculationMethod.FLOW_BALANCE, "현재 대기인원에서 목표까지 유입률/처리능력이 일정한 유입/처리 차이 계산");
    }

    // 종료 시점에 줄 끝에 선 여객의 예상 대기시간(초) = (Q+1)/C*3600.
    public Computed<Double> estimateNextArrivalWaitSec(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (queuePsgCntAtEnd == null) {
            return Computed.unavailable(CalculationMethod.NEXT_ARRIVAL_WAIT, "종료 시점 대기인원이 없습니다.");
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

    // 목표시간 안에 목표 대기인원까지 줄이는 데 필요한 총 시설 수
    public Computed<Integer> estimateRequiredServerCnt(
            FacilityQueueInput input, int targetQueueCnt, double targetTimeSec) {
        Objects.requireNonNull(input, "input");
        QueueInputValidation.nonNegative(targetQueueCnt, "targetQueueCnt");
        QueueInputValidation.positive(targetTimeSec, "targetTimeSec");
        if (queuePsgCntAtEnd == null) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "종료 시점 대기인원이 없습니다.");
        }
        Computed<Double> arrival = estimateArrivalRatePerHour(input);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.FLOW_BALANCE);
        double excess = Math.max(0, queuePsgCntAtEnd - (double) targetQueueCnt);
        double requiredRate = arrival.getValue() + excess / targetTimeSec * SECONDS_PER_HOUR;
        if (requiredRate == 0) {
            return Computed.calculated(0, CalculationMethod.FLOW_BALANCE, "잔여 초과 대기와 신규 유입이 모두 0입니다.");
        }
        Computed<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) 
            return failure(service, CalculationMethod.FLOW_BALANCE);
        
        double required = Math.max(1.0, Math.ceil(requiredRate / service.getValue()));
        if (!Double.isFinite(required) || required > Integer.MAX_VALUE) {
            return Computed.unavailable(CalculationMethod.FLOW_BALANCE, "필요 시설 수가 표현 가능한 정수 범위를 초과합니다.");
        }
        return Computed.estimated((int) required, CalculationMethod.FLOW_BALANCE, "현재 운영분을 포함한 총 소요 수");
    }

    // 구간 완료인원 / 구간초 × 3600(명/시간)
    public Computed<Double> getObservedPrcsPerHour(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (input.getPrcsPsgCnt() == null) {
            return Computed.unavailable(CalculationMethod.OBSERVED_FLOW, "구간 처리 완료인원이 없습니다.");
        }
        return number(input.getPrcsPsgCnt() / getIntervalSeconds() * SECONDS_PER_HOUR,
                false, CalculationMethod.OBSERVED_FLOW, "동일 구간 처리 완료인원 / 구간초 × 3600(명/시간)");
    }

    // 인원 보존식 Q_end - Q_start + 서비스 시작인원으로 구간 유입인원을 역산한다.
    public Computed<Integer> estimateArrivalPsgCnt(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (queuePsgCntAtEnd == null || input.getQueuePsgCntAtStart() == null
                || input.getWtngEndPsgCnt() == null) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, "시작/종료 대기인원과 서비스 시작인원이 필요합니다.");
        }
        long arrivals = (long) queuePsgCntAtEnd - input.getQueuePsgCntAtStart() + input.getWtngEndPsgCnt();
        if (arrivals < 0 || arrivals > Integer.MAX_VALUE) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, "역산 유입인원이 음수이거나 정수 범위를 초과합니다. 원천과 경계를 확인해야 합니다.");
        }
        return Computed.calculated((int) arrivals, CalculationMethod.QUEUE_BALANCE,
                "큐 이탈/이동이 없는 경우의 종료인원 - 시작인원 + 서비스 시작인원");
    }

    // 보존식 유입인원 / 구간초 × 3600(명/시간). 유입인원을 구할 수 없으면 그 사유를 그대로 전달한다.
    public Computed<Double> estimateArrivalRateByQueueBalance(FacilityQueueInput input) {
        Computed<Integer> arrivals = estimateArrivalPsgCnt(input);
        if (!arrivals.hasValue()) {
            return Computed.unavailable(CalculationMethod.QUEUE_BALANCE, arrivals.getReason());
        }
        return number(arrivals.getValue() / getIntervalSeconds() * SECONDS_PER_HOUR, true,
                CalculationMethod.QUEUE_BALANCE, "관측구간 보존식 유입인원 " + arrivals.getValue() + "명 / 구간초 × 3600 (명/시간)");
    }

    // M/M/s 정상상태의 대기확률, 평균 대기시간, 평균 대기인원을 산출한다(Erlang C).
    public Computed<ErlangCResult> analyzeErlangC(FacilityQueueInput input) {
        Objects.requireNonNull(input, "input");
        if (!input.isErlangCApplicable()) {
            return Computed.unavailable(CalculationMethod.ERLANG_C, "M/M/s 가정 확인이 필요합니다.");
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

    private static Computed<Double> number(double value, boolean estimated,
            CalculationMethod method, String reason) {
        if (!Double.isFinite(value)) {
            return Computed.unavailable(method, "계산값이 유한한 수치 표현 범위를 벗어났습니다.");
        }
        return estimated ? Computed.estimated(value, method, reason)
                : Computed.calculated(value, method, reason);
    }

    private static <T> Computed<T> failure(Computed<?> cause, CalculationMethod method) {
        return cause.getStatus() == CalcOutcome.UNREACHABLE
                ? Computed.unreachable(method, cause.getReason())
                : Computed.unavailable(method, cause.getReason());
    }
}
