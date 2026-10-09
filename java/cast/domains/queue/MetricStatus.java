package aoms.pm.cast.domains.queue;

/**
 * 숫자의 존재 여부와 해석을 함께 표현한다.
 * 특히 UNAVAILABLE과 UNREACHABLE을 0으로 대체하면 '대기가 없다'는 잘못된 의미가 된다.
 */
public enum MetricStatus {
    /** 입력된 값의 합계·비율·단위 변환 등으로 계산했다. 원천 측정의 정확성까지 보증하지는 않는다. */
    CALCULATED,
    /** 평균 처리시간의 역수, Little's Law 또는 큐 모형의 가정으로 추정했다. */
    ESTIMATED,
    /** 필수 입력이나 적용 조건이 부족하거나, 수치적으로 결과를 표현할 수 없다. */
    UNAVAILABLE,
    /** 입력은 충분하지만 현재 가정과 운영조건에서는 요청한 목표를 달성할 수 없다. */
    UNREACHABLE
}
