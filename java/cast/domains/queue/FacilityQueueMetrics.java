package aoms.pm.cast.domains.queue;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * 특정 시설의 큐 한 개와 그 큐를 처리하는 시설 그룹에 대한 구간별 분석 객체이다.
 *
 * <p>체크인 부스, 출국장 검색대 등 물리 시설의 종류와 무관하게 동일한 큐 모형을 적용한다.
 * CAST 원천 부스값을 이 클래스가 자동으로 공용 큐로 변환하지는 않는다. 실제 Queue ID와
 * 사용 가능한 처리시설을 먼저 매핑하고, 필요한 경우 공용 큐를 재계산한 뒤 생성해야 한다.</p>
 *
 * <p>핵심 입력은 평균 처리시간 S, 평균 대기시간 Wq, 대기인원이다. 대기인원은
 * 시간평균 Lq와 종료 시점 Q를 구분한다. 둘 중 원천에 있는 값만 넣으며 서로 대체하지 않는다.
 * 같은 10분 구간이라는 사실만으로 서로 다른 모집단의 평균을 합하거나
 * Little's Law를 적용할 수는 없다.</p>
 *
 * <p>계산에 필요한 값이 없으면 MetricResult의 UNAVAILABLE을 반환한다.
 * 잘못된 입력(음수, NaN, 무한대)은 생성 시 예외로 거부한다. 도출값이 없다는 이유로
 * 0을 넣거나 음수로 역산된 유입인원을 임의로 0으로 보정하지 않는다.</p>
 *
 * <p>학습 근거: Little's Law https://web.mit.edu/urban_or_book/www/book/chapter4/4.4.html
 * 및 MIT Queueing Systems Lecture 2의 M/M/m 모형이다. 운영 적용 전에는 원천 지표의
 * 의미·집계 모집단·큐와 시설의 연결·모형 가정을 별도로 검증해야 한다.</p>
 */
public final class FacilityQueueMetrics {
    private static final double SECONDS_PER_HOUR = 3600.0;

    /** 터미널 ID. 기존 T1/T2 등의 서버 코드값을 그대로 사용한다. */
    private final String tmnlId;

    /** 시설유형 코드. 기존 CHKN/DEP/SC 등의 값이며 이 클래스가 DTO 계약을 변경하지 않는다. */
    private final String fcltType;

    /** 아일랜드·출국장 등 시설 ID. 같은 유형에 여러 시설이 있으므로 유형만으로 식별하지 않는다. */
    private final String fcltId;

    /** 시설 내 큐 ID. 하나의 아일랜드에 큐가 여러 개이면 각각 다른 객체를 만든다. */
    private final String queueId;

    /** 공항 현지시각 기준 관측 구간 시작. CAST/Xovis의 시간대를 먼저 맞춰야 한다. */
    private final LocalDateTime intervalStart;

    /** 관측 구간 종료. 기본은 시작 후 10분이며, 다른 구간 길이도 명시할 수 있다. */
    private final LocalDateTime intervalEnd;

    /** CAST 예측·Xovis 실적·수동 입력을 구분하는 출처. */
    private final QueueDataSource source;

    /** 단일 처리시설에서 여객 1명을 처리한 평균시간(초). 자료 없음은 null, 0은 유효 처리율을 계산할 수 없는 값이다. */
    private final Double avgPrcsTimeSec;

    /** 서비스 시작 전까지의 여객평균 대기시간(초). 체류시간을 넣으면 처리시간이 중복된다. */
    private final Double avgWtngTimeSec;

    /** 시간평균 대기인원 Lq(명). 구간 종료 스냅샷과 다르며 소수도 가능하다. */
    private final Double avgQueuePsgCnt;

    /** 구간 종료 시점 대기인원 Q(명). 혼잡 해소시간의 초기 상태로 사용한다. */
    private final Integer queuePsgCntAtEnd;

    /** 평균 처리시간과 평균 대기시간이 같은 여객 모집단·관측 기준을 대표하는지 확인한 값. 기본은 false이다. */
    private final boolean samePassengerPopulation;

    private FacilityQueueMetrics(Builder builder) {
        QueueInputValidation.requiredText(builder.tmnlId, "tmnlId");
        QueueInputValidation.requiredText(builder.fcltType, "fcltType");
        QueueInputValidation.requiredText(builder.fcltId, "fcltId");
        QueueInputValidation.requiredText(builder.queueId, "queueId");
        Objects.requireNonNull(builder.intervalStart, "intervalStart");
        Objects.requireNonNull(builder.source, "source");
        LocalDateTime end = builder.intervalEnd == null
                ? builder.intervalStart.plusMinutes(10) : builder.intervalEnd;
        if (!end.isAfter(builder.intervalStart)) {
            throw new IllegalArgumentException("intervalEnd must be after intervalStart");
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
        this.samePassengerPopulation = builder.samePassengerPopulation;
    }

    /** 종료 시각을 지정하지 않으면 시작 후 10분으로 설정한다. */
    public static Builder builder() { return new Builder(); }

    /** 실제 구간 길이를 초로 반환한다. 계산식에 600을 고정하지 않고 두 시각에서 구한다. */
    public double getIntervalSeconds() {
        Duration duration = Duration.between(intervalStart, intervalEnd);
        return duration.getSeconds() + duration.getNano() / 1_000_000_000.0;
    }

    /**
     * 평균 체류시간 W = Wq + S(초).
     * 평균 대기와 평균 처리가 같은 여객 집단을 대표할 때 기대값의 덧셈을 적용한다.
     * 예: 대기 600초·처리 120초이면 평균 720초. 서로 다른 집단의 평균은 합산하지 않는다.
     */
    public MetricResult<Double> getAvgSojournTimeSec() {
        String missing = comparableTimesIssue();
        if (missing != null) return MetricResult.unavailable(CalculationMethod.DIRECT, missing);
        return number(avgWtngTimeSec + avgPrcsTimeSec, false, CalculationMethod.DIRECT,
                "같은 여객 모집단의 평균 대기시간 + 평균 처리시간(초)");
    }

    /**
     * 체류시간 중 대기가 차지하는 비율 Wq / (Wq + S). 값은 백분율이 아닌 0~1 비율이다.
     * 0.8이면 80%이며 SLA 달성률이나 시설 가동률을 의미하지 않는다.
     * 두 시간이 모두 0이면 분모가 0이므로 산출 불가이다.
     */
    public MetricResult<Double> getWaitingTimeShare() {
        MetricResult<Double> total = getAvgSojournTimeSec();
        if (!total.hasValue()) return failure(total, CalculationMethod.DIRECT);
        if (total.getValue() == 0) {
            return MetricResult.unavailable(CalculationMethod.DIRECT, "체류시간이 0이라 대기 비중을 정의할 수 없습니다.");
        }
        return number(avgWtngTimeSec / total.getValue(), false, CalculationMethod.DIRECT,
                "평균 대기시간 / 평균 체류시간. 0~1 비율");
    }

    /** 평균 대기가 평균 처리의 몇 배인지 Wq/S로 구한다. 처리시간이 0이면 나눌 수 없다. */
    public MetricResult<Double> getWaitingToServiceRatio() {
        String missing = comparableTimesIssue();
        if (missing != null) return MetricResult.unavailable(CalculationMethod.DIRECT, missing);
        if (avgPrcsTimeSec == 0) {
            return MetricResult.unavailable(CalculationMethod.DIRECT, "평균 처리시간이 0입니다.");
        }
        return number(avgWtngTimeSec / avgPrcsTimeSec, false, CalculationMethod.DIRECT,
                "평균 대기시간 / 평균 처리시간. 단위 없는 배수");
    }

    /**
     * 시간평균 대기인원 × 구간초 = 누적 대기부담(명·초).
     * 큐 인원 곡선의 구간 적분값이며, 종료 스냅샷 × 구간초와는 다르다.
     * 이 구간에 입장 또는 완료한 사람만의 전체 대기시간 합계와도 일반적으로 다르다.
     */
    public MetricResult<Double> getQueuePersonSeconds() {
        if (avgQueuePsgCnt == null) {
            return MetricResult.unavailable(CalculationMethod.DIRECT, "시간평균 대기인원이 없습니다.");
        }
        return number(avgQueuePsgCnt * getIntervalSeconds(), false, CalculationMethod.DIRECT,
                "시간평균 대기인원 × 구간초(명·초)");
    }

    /**
     * 단일 시설의 대표 처리율 mu = 3600/S(명/시간).
     * 한 시설이 한 번에 한 명씩 연속 처리할 때의 평균 처리능력 추정이며 실제 통과율이 아니다.
     * 시설별 속도가 다르면 전체 평균의 역수에 시설 수를 곱해 정밀 용량을 구할 수 없다.
     */
    public MetricResult<Double> estimateServiceRatePerHour() {
        if (avgPrcsTimeSec == null || avgPrcsTimeSec == 0) {
            return MetricResult.unavailable(CalculationMethod.SERVICE_TIME, "양수인 단일 시설 평균 처리시간이 필요합니다.");
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
    public MetricResult<Double> estimateArrivalRatePerHour(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (context.getArrivalRatePerHour() != null) {
            return number(context.getArrivalRatePerHour(), context.isArrivalRateEstimated(),
                    CalculationMethod.EXTERNAL_INPUT, "호출자가 별도로 제공한 유입률(명/시간)");
        }
        if (!context.isLittleLawApplicable()) {
            return MetricResult.unavailable(CalculationMethod.LITTLE_LAW,
                    "별도 유입률이 없고 Little's Law 적용 가능성도 확인되지 않았습니다.");
        }
        if (avgQueuePsgCnt == null || avgWtngTimeSec == null || avgWtngTimeSec == 0) {
            return MetricResult.unavailable(CalculationMethod.LITTLE_LAW,
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
    public MetricResult<Double> estimateCapacityPerHour(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (context.getOprServerCnt() == null) {
            return MetricResult.unavailable(CalculationMethod.CAPACITY_MODEL, "운영 처리시설 수가 없습니다.");
        }
        if (context.getOprServerCnt() == 0) {
            return number(0, false, CalculationMethod.CAPACITY_MODEL, "운영 처리시설이 0개이므로 처리능력도 0입니다.");
        }
        if (!context.isSharedHomogeneousServers()) {
            return MetricResult.unavailable(CalculationMethod.CAPACITY_MODEL, "동일 속도의 공용 처리시설 그룹인지 확인되지 않았습니다.");
        }
        MetricResult<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) return failure(service, CalculationMethod.CAPACITY_MODEL);
        return number(context.getOprServerCnt() * service.getValue(), true, CalculationMethod.CAPACITY_MODEL,
                "동일 속도의 공용 처리시설 수 × 대표 처리율(명/시간)");
    }

    /**
     * 유입 부하 rho=lambda/C. 1 이상이면 처리능력 이상의 유입이라는 뜻이다.
     * 실제 가동률이 아니므로 1 초과 값을 1로 잘라내지 않는다. C=0이면 유한 비율을 정의하지 않는다.
     */
    public MetricResult<Double> estimateLoadRatio(FacilityQueueContext context) {
        MetricResult<Double> capacity = estimateCapacityPerHour(context);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.CAPACITY_MODEL);
        if (capacity.getValue() == 0) {
            return MetricResult.unavailable(CalculationMethod.CAPACITY_MODEL, "처리능력이 0이라 유한한 부하율을 정의할 수 없습니다.");
        }
        MetricResult<Double> arrival = estimateArrivalRatePerHour(context);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.CAPACITY_MODEL);
        return number(arrival.getValue() / capacity.getValue(), true, CalculationMethod.CAPACITY_MODEL,
                "유입률 / 처리능력. 1 초과는 과부하이며 실제 가동률이 아닙니다. 유입 근거: " + arrival.getMethod());
    }

    /**
     * 순감소 능력 C-lambda(명/시간). 양수는 대기 감소, 0은 유지, 음수는 증가 방향이다.
     * 이는 여객이 충분히 있고 현재 조건이 유지될 때의 잠재적 감소율이다.
     * 큐가 비어 있는 동안에도 이 속도로 계속 인원이 감소한다는 의미는 아니다.
     */
    public MetricResult<Double> estimateNetDrainRatePerHour(FacilityQueueContext context) {
        MetricResult<Double> capacity = estimateCapacityPerHour(context);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.FLUID_APPROXIMATION);
        MetricResult<Double> arrival = estimateArrivalRatePerHour(context);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.FLUID_APPROXIMATION);
        return number(capacity.getValue() - arrival.getValue(), true, CalculationMethod.FLUID_APPROXIMATION,
                "처리능력 - 유입률(명/시간). 유입 근거: " + arrival.getMethod());
    }

    /**
     * 현재 종료 스냅샷 Q에서 목표 인원까지 감소하는 시간(초)을 유입/처리 차이 계산한다.
     * t=max(0,Q-target)/(C-lambda)*3600. 조건이 미래에도 일정해야 한다.
     * 이미 목표 이하이면 0초, 목표 초과인데 {@code C <= lambda}이면 현재 조건으로는 달성 불가이다.
     * 현재 여객 한 명의 평균 대기시간이나 실제 해소시각을 이 식으로 확정할 수는 없다.
     */
    public MetricResult<Double> estimateClearTimeSec(FacilityQueueContext context, int targetQueueCnt) {
        Objects.requireNonNull(context, "context");
        QueueInputValidation.nonNegative(Integer.valueOf(targetQueueCnt), "targetQueueCnt");
        if (queuePsgCntAtEnd == null) {
            return MetricResult.unavailable(CalculationMethod.FLUID_APPROXIMATION, "종료 시점 대기인원이 없습니다.");
        }
        if (queuePsgCntAtEnd <= targetQueueCnt) {
            return number(0, false, CalculationMethod.DIRECT, "종료 시점 대기인원이 이미 목표 이하입니다.");
        }
        if (!context.isConstantRates()) {
            return MetricResult.unavailable(CalculationMethod.FLUID_APPROXIMATION, "예측 구간의 유입률·처리율·운영 수 유지 가정이 필요합니다.");
        }
        MetricResult<Double> drain = estimateNetDrainRatePerHour(context);
        if (!drain.hasValue()) return failure(drain, CalculationMethod.FLUID_APPROXIMATION);
        if (drain.getValue() <= 0) {
            return MetricResult.unreachable(CalculationMethod.FLUID_APPROXIMATION, "처리능력이 유입률 이하라 현재 조건으로 목표까지 감소하지 않습니다.");
        }
        return number((queuePsgCntAtEnd - (double) targetQueueCnt) / drain.getValue() * SECONDS_PER_HOUR,
                true, CalculationMethod.FLUID_APPROXIMATION, "현재 대기인원에서 목표까지 유입률·처리능력이 일정한 유입/처리 차이 계산");
    }

    /**
     * 목표시간 T초 안에 목표 대기인원까지 줄이는 데 필요한 총 처리시설 수를 구한다.
     * required=ceil((lambda+max(0,Q-target)*3600/T)/mu).
     * 추가 수가 아니라 현재 운영분을 포함한 총 수이다. 0.2개 시설은 운영할 수 없어 올림한다.
     * 보유 수를 초과해도 필요한 수는 그대로 반환하고, 실현 가능성은 별도 메서드로 판단한다.
     * 이미 목표 이하이어도 신규 유입을 감당할 용량을 유지한다는 정책으로 계산한다.
     * 이론 최소량이며 변동성·안전 여유·SLA를 보장하는 Erlang C 인력 산정과는 다르다.
     */
    public MetricResult<Integer> estimateRequiredServerCnt(
            FacilityQueueContext context, int targetQueueCnt, double targetTimeSec) {
        Objects.requireNonNull(context, "context");
        QueueInputValidation.nonNegative(Integer.valueOf(targetQueueCnt), "targetQueueCnt");
        QueueInputValidation.positive(targetTimeSec, "targetTimeSec");
        if (queuePsgCntAtEnd == null) {
            return MetricResult.unavailable(CalculationMethod.FLUID_APPROXIMATION, "종료 시점 대기인원이 없습니다.");
        }
        if (!context.isConstantRates() || !context.isSharedHomogeneousServers()) {
            return MetricResult.unavailable(CalculationMethod.FLUID_APPROXIMATION, "일정한 유입률과 동일 속도의 공용 처리시설 가정이 필요합니다.");
        }
        MetricResult<Double> arrival = estimateArrivalRatePerHour(context);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.FLUID_APPROXIMATION);
        double excess = Math.max(0, queuePsgCntAtEnd - (double) targetQueueCnt);
        double requiredRate = arrival.getValue() + excess / targetTimeSec * SECONDS_PER_HOUR;
        if (requiredRate == 0) {
            return MetricResult.calculated(0, CalculationMethod.FLUID_APPROXIMATION, "잔여 초과 대기와 신규 유입이 모두 0입니다.");
        }
        MetricResult<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) return failure(service, CalculationMethod.FLUID_APPROXIMATION);
        // 양수 수요를 양수 처리율로 나눈 값이 극소수 언더플로로 0이 되어도 최소 1개는 필요하다.
        double required = Math.max(1.0, Math.ceil(requiredRate / service.getValue()));
        if (!Double.isFinite(required) || required > Integer.MAX_VALUE) {
            return MetricResult.unavailable(CalculationMethod.FLUID_APPROXIMATION, "필요 시설 수가 표현 가능한 정수 범위를 초과합니다.");
        }
        return MetricResult.estimated((int) required, CalculationMethod.FLUID_APPROXIMATION,
                "현재 운영분을 포함한 총 소요 수. 보유 한도·변동성·SLA는 별도 검토해야 합니다.");
    }

    /** 추가 시설 수=max(0,필요 총 수-현재 운영 수). 보유 수를 초과하는 요구를 숨기지 않는다. */
    public MetricResult<Integer> estimateAdditionalServerCnt(
            FacilityQueueContext context, int targetQueueCnt, double targetTimeSec) {
        Objects.requireNonNull(context, "context");
        if (context.getOprServerCnt() == null) {
            return MetricResult.unavailable(CalculationMethod.FLUID_APPROXIMATION, "현재 운영 처리시설 수가 없습니다.");
        }
        MetricResult<Integer> required = estimateRequiredServerCnt(context, targetQueueCnt, targetTimeSec);
        if (!required.hasValue()) return failure(required, CalculationMethod.FLUID_APPROXIMATION);
        return MetricResult.estimated(Math.max(0, required.getValue() - context.getOprServerCnt()),
                CalculationMethod.FLUID_APPROXIMATION, "필요 총 시설 수 - 현재 운영 수. 최소 0개");
    }

    /**
     * 필요 총 수가 배정 가능 최대 수 이하이면 true, 초과이면 false이다.
     * false도 계산된 의미 있는 결과이며, 보유 수 자체가 없는 UNAVAILABLE과 구분한다.
     */
    public MetricResult<Boolean> assessCapacityFeasibility(
            FacilityQueueContext context, int targetQueueCnt, double targetTimeSec) {
        Objects.requireNonNull(context, "context");
        if (context.getTotServerCnt() == null) {
            return MetricResult.unavailable(CalculationMethod.CAPACITY_COMPARISON, "이 큐에 배정 가능한 최대 시설 수가 없습니다.");
        }
        MetricResult<Integer> required = estimateRequiredServerCnt(context, targetQueueCnt, targetTimeSec);
        if (!required.hasValue()) return failure(required, CalculationMethod.CAPACITY_COMPARISON);
        return MetricResult.estimated(required.getValue() <= context.getTotServerCnt(),
                CalculationMethod.CAPACITY_COMPARISON, "필요 총 시설 수와 배정 가능 최대 수를 비교한 유입/처리 차이 계산 기준 판단");
    }

    /** 구간 완료인원/구간초*3600. 실제 관측 통과율이며 잠재 처리능력을 뜻하지 않는다. */
    public MetricResult<Double> getObservedThroughputPerHour(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (context.getPrcsPsgCnt() == null) {
            return MetricResult.unavailable(CalculationMethod.OBSERVED_FLOW, "구간 처리 완료인원이 없습니다.");
        }
        return number(context.getPrcsPsgCnt() / getIntervalSeconds() * SECONDS_PER_HOUR,
                false, CalculationMethod.OBSERVED_FLOW, "동일 구간 처리 완료인원 / 구간초 × 3600(명/시간)");
    }

    /**
     * 모든 시설의 처리 중 시간 합/운영 가능 시간 합. 0~1 범위의 실제 가동률이다.
     * 운영시간 합을 사용하므로 구간 중 개폐가 있어도 측정된 시간을 반영할 수 있다.
     * 운영 가능 시간이 0이면 0/0을 0%로 표시하지 않고 산출 불가로 반환한다.
     */
    public MetricResult<Double> getObservedUtilization(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (context.getBusyServerTimeSec() == null || context.getAvailableServerTimeSec() == null
                || context.getAvailableServerTimeSec() == 0) {
            return MetricResult.unavailable(CalculationMethod.OBSERVED_FLOW, "처리 중 시간과 양수인 운영 가능 시간 합계가 필요합니다.");
        }
        return number(context.getBusyServerTimeSec() / context.getAvailableServerTimeSec(),
                false, CalculationMethod.OBSERVED_FLOW, "처리 중 시설·초 / 운영 가능 시설·초. 0~1 비율");
    }

    /** (종료 스냅샷-시작 스냅샷)/구간초*3600. 음수도 정상이며 큐 감소를 뜻한다. */
    public MetricResult<Double> getQueueGrowthRatePerHour(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (queuePsgCntAtEnd == null || context.getQueuePsgCntAtStart() == null) {
            return MetricResult.unavailable(CalculationMethod.OBSERVED_FLOW, "구간 시작·종료 시점 대기인원이 필요합니다.");
        }
        return number((queuePsgCntAtEnd - (double) context.getQueuePsgCntAtStart())
                / getIntervalSeconds() * SECONDS_PER_HOUR, false, CalculationMethod.OBSERVED_FLOW,
                "대기인원 순변화 / 구간초 × 3600. 신규 유입률 자체는 아닙니다.");
    }

    /**
     * 인원 보존식 A=Q_end-Q_start+서비스 시작인원으로 구간 유입인원을 역산한다.
     * 큐 이탈·이동이 없는 동일 경계 기준이 필요하다. 완료인원은 이 식에 바로 넣지 않는다.
     * 결과가 음수이면 측정 범위·시각·누계 여부가 맞지 않는 것이므로 0으로 덮지 않는다.
     */
    public MetricResult<Integer> estimateArrivalPsgCnt(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (!context.isNoAbandonmentOrTransfers()) {
            return MetricResult.unavailable(CalculationMethod.CONSERVATION, "큐 이탈·다른 큐 이동·측정영역 변경이 없다는 확인이 필요합니다.");
        }
        if (queuePsgCntAtEnd == null || context.getQueuePsgCntAtStart() == null
                || context.getServiceStartPsgCnt() == null) {
            return MetricResult.unavailable(CalculationMethod.CONSERVATION, "시작·종료 대기인원과 서비스 시작인원이 필요합니다.");
        }
        long arrivals = (long) queuePsgCntAtEnd - context.getQueuePsgCntAtStart() + context.getServiceStartPsgCnt();
        if (arrivals < 0 || arrivals > Integer.MAX_VALUE) {
            return MetricResult.unavailable(CalculationMethod.CONSERVATION, "역산 유입인원이 음수이거나 정수 범위를 초과합니다. 원천과 경계를 확인해야 합니다.");
        }
        return MetricResult.calculated((int) arrivals, CalculationMethod.CONSERVATION,
                "큐 이탈·이동이 없는 경우의 종료인원 - 시작인원 + 서비스 시작인원");
    }

    /**
     * M/M/s 정상상태의 대기확률 C, 이론 평균 대기시간·대기인원을 산출한다.
     * 실제 관측 대기시간을 이 값으로 덮어쓰지 않는다. lambda>=s*mu이면 유한 정상상태가 없다.
     * 유입률을 관측 Wq에서 역산했다면 이론 Wq와의 비교는 독립적인 검증이 될 수 없다.
     *
     * <p>팩토리얼과 a의 거듭제곱 대신 Erlang B 재귀를 사용해 큰 시설 수의 오버플로를 줄인다.
     * B_0=1, B_n=a*B_(n-1)/(n+a*B_(n-1));
     * C=B_s/(1-rho+rho*B_s), rho=lambda/(s*mu).</p>
     */
    public MetricResult<ErlangCResult> analyzeErlangC(FacilityQueueContext context) {
        Objects.requireNonNull(context, "context");
        if (!context.isMmSApplicable() || !context.isConstantRates() || !context.isSharedHomogeneousServers()) {
            return MetricResult.unavailable(CalculationMethod.ERLANG_C, "M/M/s 가정과 일정한 유입률·동일 속도 공용 처리시설 가정 확인이 필요합니다.");
        }
        MetricResult<Double> capacity = estimateCapacityPerHour(context);
        if (!capacity.hasValue()) return failure(capacity, CalculationMethod.ERLANG_C);
        if (capacity.getValue() == 0) {
            return MetricResult.unavailable(CalculationMethod.ERLANG_C, "M/M/s에는 양수인 운영 수와 처리율이 필요합니다.");
        }
        MetricResult<Double> arrival = estimateArrivalRatePerHour(context);
        if (!arrival.hasValue()) return failure(arrival, CalculationMethod.ERLANG_C);
        MetricResult<Double> service = estimateServiceRatePerHour();
        if (!service.hasValue()) return failure(service, CalculationMethod.ERLANG_C);
        double netRate = capacity.getValue() - arrival.getValue();
        if (netRate <= 0) {
            return MetricResult.unavailable(CalculationMethod.ERLANG_C, "유입률이 총 처리능력 이상이라 유한한 정상상태 대기값이 없습니다.");
        }
        double load = arrival.getValue() / capacity.getValue();
        double offeredLoad = arrival.getValue() / service.getValue();
        double erlangB = 1.0;
        for (int index = 0; index < context.getOprServerCnt(); index++) {
            double weighted = offeredLoad * erlangB;
            erlangB = weighted / (index + 1.0 + weighted);
        }
        double waitProbability = erlangB / (1.0 - load + load * erlangB);
        double avgWaitSec = waitProbability / netRate * SECONDS_PER_HOUR;
        double avgQueue = arrival.getValue() / SECONDS_PER_HOUR * avgWaitSec;
        if (!Double.isFinite(avgWaitSec) || !Double.isFinite(avgQueue)) {
            return MetricResult.unavailable(CalculationMethod.ERLANG_C, "정상상태 값이 수치 표현 범위를 초과합니다.");
        }
        ErlangCResult result = new ErlangCResult(arrival.getValue(), service.getValue(),
                context.getOprServerCnt(), load, waitProbability, avgWaitSec, avgQueue, netRate);
        return MetricResult.estimated(result, CalculationMethod.ERLANG_C,
                "M/M/s 정상상태 모형값. 유입 근거: " + arrival.getMethod()
                        + ". Little's Law 역산 유입이면 관측 대기시간과 독립적인 검증이 아닙니다.");
    }

    private String comparableTimesIssue() {
        if (avgPrcsTimeSec == null || avgWtngTimeSec == null) return "평균 처리시간과 평균 대기시간이 모두 필요합니다.";
        return samePassengerPopulation ? null : "두 평균시간이 같은 여객 모집단을 대표하는지 확인되지 않았습니다.";
    }

    /** 0 나눗셈은 각 메서드에서 처리하고, 최종 산술 오버플로는 잘못된 숫자 대신 산출 불가로 바꾼다. */
    private static MetricResult<Double> number(double value, boolean estimated,
            CalculationMethod method, String reason) {
        if (!Double.isFinite(value)) {
            return MetricResult.unavailable(method, "계산값이 유한한 수치 표현 범위를 벗어났습니다.");
        }
        return estimated ? MetricResult.estimated(value, method, reason)
                : MetricResult.calculated(value, method, reason);
    }

    /** 선행 계산 실패의 사유를 보존한다. 실패를 기본값 0으로 바꿔 후속 계산을 계속하지 않는다. */
    private static <T> MetricResult<T> failure(MetricResult<?> cause, CalculationMethod method) {
        return cause.getStatus() == MetricStatus.UNREACHABLE
                ? MetricResult.unreachable(method, cause.getReason())
                : MetricResult.unavailable(method, cause.getReason());
    }

    /** 터미널 ID. 기존 T1/T2 등의 서버 코드값을 그대로 사용한다. */
    public String getTmnlId() { return tmnlId; }

    /** 시설유형 코드. 기존 CHKN/DEP/SC 등의 값이며 이 클래스가 DTO 계약을 변경하지 않는다. */
    public String getFcltType() { return fcltType; }

    /** 아일랜드·출국장 등 시설 ID. 같은 유형에 여러 시설이 있으므로 유형만으로 식별하지 않는다. */
    public String getFcltId() { return fcltId; }

    /** 시설 내 큐 ID. 하나의 아일랜드에 큐가 여러 개이면 각각 다른 객체를 만든다. */
    public String getQueueId() { return queueId; }

    /** 공항 현지시각 기준 관측 구간 시작. CAST/Xovis의 시간대를 먼저 맞춰야 한다. */
    public LocalDateTime getIntervalStart() { return intervalStart; }

    /** 관측 구간 종료. 기본은 시작 후 10분이며, 다른 구간 길이도 명시할 수 있다. */
    public LocalDateTime getIntervalEnd() { return intervalEnd; }

    /** CAST 예측·Xovis 실적·수동 입력을 구분하는 출처. */
    public QueueDataSource getSource() { return source; }

    /** 단일 처리시설에서 여객 1명을 처리한 평균시간(초). 자료 없음은 null, 0은 유효 처리율을 계산할 수 없는 값이다. */
    public Double getAvgPrcsTimeSec() { return avgPrcsTimeSec; }

    /** 서비스 시작 전까지의 여객평균 대기시간(초). 체류시간을 넣으면 처리시간이 중복된다. */
    public Double getAvgWtngTimeSec() { return avgWtngTimeSec; }

    /** 시간평균 대기인원 Lq(명). 구간 종료 스냅샷과 다르며 소수도 가능하다. */
    public Double getAvgQueuePsgCnt() { return avgQueuePsgCnt; }

    /** 구간 종료 시점 대기인원 Q(명). 혼잡 해소시간의 초기 상태로 사용한다. */
    public Integer getQueuePsgCntAtEnd() { return queuePsgCntAtEnd; }

    /** 평균 처리시간과 평균 대기시간이 같은 여객 모집단·관측 기준을 대표하는지 확인한 값. 기본은 false이다. */
    public boolean isSamePassengerPopulation() { return samePassengerPopulation; }

    /** 선택값을 null로 유지하고, 실제 숫자 0과 자료 없음을 구분하는 생성용 빌더이다. */
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
        private boolean samePassengerPopulation;

        private Builder() { }

        /** 터미널 ID. 기존 T1/T2 등의 서버 코드값을 그대로 사용한다. */
        public Builder tmnlId(String value) { this.tmnlId = value; return this; }

        /** 시설유형 코드. 기존 CHKN/DEP/SC 등의 값이며 이 클래스가 DTO 계약을 변경하지 않는다. */
        public Builder fcltType(String value) { this.fcltType = value; return this; }

        /** 아일랜드·출국장 등 시설 ID. 같은 유형에 여러 시설이 있으므로 유형만으로 식별하지 않는다. */
        public Builder fcltId(String value) { this.fcltId = value; return this; }

        /** 시설 내 큐 ID. 하나의 아일랜드에 큐가 여러 개이면 각각 다른 객체를 만든다. */
        public Builder queueId(String value) { this.queueId = value; return this; }

        /** 공항 현지시각 기준 관측 구간 시작. CAST/Xovis의 시간대를 먼저 맞춰야 한다. */
        public Builder intervalStart(LocalDateTime value) { this.intervalStart = value; return this; }

        /** 관측 구간 종료. 기본은 시작 후 10분이며, 다른 구간 길이도 명시할 수 있다. */
        public Builder intervalEnd(LocalDateTime value) { this.intervalEnd = value; return this; }

        /** CAST 예측·Xovis 실적·수동 입력을 구분하는 출처. */
        public Builder source(QueueDataSource value) { this.source = value; return this; }

        /** 단일 처리시설에서 여객 1명을 처리한 평균시간(초). 자료 없음은 null, 0은 유효 처리율을 계산할 수 없는 값이다. */
        public Builder avgPrcsTimeSec(Double value) { this.avgPrcsTimeSec = value; return this; }

        /** 서비스 시작 전까지의 여객평균 대기시간(초). 체류시간을 넣으면 처리시간이 중복된다. */
        public Builder avgWtngTimeSec(Double value) { this.avgWtngTimeSec = value; return this; }

        /** 시간평균 대기인원 Lq(명). 구간 종료 스냅샷과 다르며 소수도 가능하다. */
        public Builder avgQueuePsgCnt(Double value) { this.avgQueuePsgCnt = value; return this; }

        /** 구간 종료 시점 대기인원 Q(명). 혼잡 해소시간의 초기 상태로 사용한다. */
        public Builder queuePsgCntAtEnd(Integer value) { this.queuePsgCntAtEnd = value; return this; }

        /** 평균 처리시간과 평균 대기시간이 같은 여객 모집단·관측 기준을 대표하는지 확인한 값. 기본은 false이다. */
        public Builder samePassengerPopulation(boolean value) { this.samePassengerPopulation = value; return this; }

        /** 식별정보·시각·출처를 확인하고 음수와 비유한 숫자를 거부한 뒤 불변 객체를 만든다. */
        public FacilityQueueMetrics build() { return new FacilityQueueMetrics(this); }
    }
}
