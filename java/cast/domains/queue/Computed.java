package aoms.pm.cast.domains.queue;

import java.util.Objects;

/**
 * 계산값과 산출 방법을 함께 보관하는 불변 결과이다.
 *
 * <p>예: value=180, status=ESTIMATED, method=LITTLE_LAW라면 '시간당 유입 180명 추정'이다.
 * value가 같은 180이어도 관측 완료 인원에서 계산한 통과율과는 의미가 다르다.
 * UNAVAILABLE/UNREACHABLE에서는 value가 null이고 reason에 사유가 남는다.</p>
 *
 * @param <T> Double, Integer, Boolean 또는 ErlangCResult 등의 결과 타입
 */
public final class Computed<T> {
    private final T value;
    private final MetricStatus status;
    private final CalculationMethod method;
    private final String reason;

    private Computed(T value, MetricStatus status, CalculationMethod method, String reason) {
        this.value = value;
        this.status = Objects.requireNonNull(status, "status");
        this.method = Objects.requireNonNull(method, "method");
        this.reason = Objects.requireNonNull(reason, "reason");
    }

    /** 입력값에서 직접 계산한 결과를 만든다. 값이 없으면 unavailable을 사용해야 한다. */
    public static <T> Computed<T> calculated(T value, CalculationMethod method, String reason) {
        return new Computed<>(requireValue(value), MetricStatus.CALCULATED, method, reason);
    }

    /** 모델이나 근사 가정에 의존한 결과를 만든다. reason에는 중요한 가정을 적는다. */
    public static <T> Computed<T> estimated(T value, CalculationMethod method, String reason) {
        return new Computed<>(requireValue(value), MetricStatus.ESTIMATED, method, reason);
    }

    /** 입력 부족·모형 미적용·수치 범위 초과를 표현한다. 계산되지 않은 값에 0을 넣지 않는다. */
    public static <T> Computed<T> unavailable(CalculationMethod method, String reason) {
        return new Computed<>(null, MetricStatus.UNAVAILABLE, method, reason);
    }

    /** 현재 조건에서 목표 해소 등이 불가능함을 표현한다. 입력 부족과는 다른 상태이다. */
    public static <T> Computed<T> unreachable(CalculationMethod method, String reason) {
        return new Computed<>(null, MetricStatus.UNREACHABLE, method, reason);
    }

    private static <T> T requireValue(T value) {
        Objects.requireNonNull(value, "value");
        if (value instanceof Number && !Double.isFinite(((Number) value).doubleValue())) {
            throw new IllegalArgumentException("value must be finite");
        }
        return value;
    }

    /** CALCULATED/ESTIMATED일 때만 true이다. 이 값을 확인한 뒤 getValue()를 사용한다. */
    public boolean hasValue() {
        return value != null;
    }

    /** 산출 불가 또는 목표 달성 불가이면 null이다. 임의의 기본값으로 보정하지 않는다. */
    public T getValue() { return value; }
    /** 직접 계산인지 추정인지, 또는 값이 없는 이유의 분류이다. */
    public MetricStatus getStatus() { return status; }
    /** 결과를 만든 수식 또는 입력의 출처이다. */
    public CalculationMethod getMethod() { return method; }
    /** 적용 가정이나 계산 불가 사유이다. 숫자만 표시하면 이 정보가 사라질 수 있다. */
    public String getReason() { return reason; }

    @Override
    public String toString() {
        return "Computed{value=" + value + ", status=" + status + ", method=" + method
                + ", reason='" + reason + "'}";
    }
}
