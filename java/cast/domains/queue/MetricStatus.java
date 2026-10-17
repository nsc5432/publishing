package aoms.pm.cast.domains.queue;

public enum MetricStatus {
    CALCULATED,
    ESTIMATED,
    UNAVAILABLE, // 입력 부족
    UNREACHABLE // 입력은 충분하지만 조건에서 불가능한 경우
}
