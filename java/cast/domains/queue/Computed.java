package aoms.pm.cast.domains.queue;

import java.util.Objects;

import lombok.Getter;

/**
 * 계산값과 산출 방법을 관리.
 */
@Getter
public final class Computed<T> {
    private final T value;
    private final CalcOutcome status;
    private final CalculationMethod method;
    private final String reason;

    private Computed(T value, CalcOutcome status, CalculationMethod method, String reason) {
        this.value = value;
        this.status = Objects.requireNonNull(status, "status");
        this.method = Objects.requireNonNull(method, "method");
        this.reason = Objects.requireNonNull(reason, "reason");
    }

    public static <T> Computed<T> calculated(T value, CalculationMethod method, String reason) {
        return new Computed<>(requireValue(value), CalcOutcome.CALCULATED, method, reason);
    }

    public static <T> Computed<T> estimated(T value, CalculationMethod method, String reason) {
        return new Computed<>(requireValue(value), CalcOutcome.ESTIMATED, method, reason);
    }

    public static <T> Computed<T> unavailable(CalculationMethod method, String reason) {
        return new Computed<>(null, CalcOutcome.UNAVAILABLE, method, reason);
    }

    public static <T> Computed<T> unreachable(CalculationMethod method, String reason) {
        return new Computed<>(null, CalcOutcome.UNREACHABLE, method, reason);
    }

    private static <T> T requireValue(T value) {
        Objects.requireNonNull(value, "value");

        if (value instanceof Number && !Double.isFinite(((Number) value).doubleValue())) {
            throw new IllegalArgumentException("값은 유한한 숫자여야 합니다.");
        }

        return value;
    }

    public boolean hasValue() {
        return value != null;
    }

    @Override
    public String toString() {
        return "Computed{value=" + value + ", status=" + status + ", method=" + method + ", reason='" + reason + "'}";
    }
}
