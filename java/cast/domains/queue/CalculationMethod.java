package aoms.pm.cast.domains.queue;

public enum CalculationMethod {
    /** 합계·비율·누적 대기부담 등 입력값 사이의 직접적인 산술 계산. */
    DIRECT,
    /** 호출자가 별도로 전달한 유입률. 측정 또는 추정 여부는 결과 상태로 표시한다. */
    EXTERNAL_INPUT,
    /** 평균 처리시간의 역수로 대표 처리율을 추정한다. */
    SERVICE_TIME,
    /** 시간평균 대기인원과 평균 대기시간의 관계 Lq = lambda * Wq를 사용한다. */
    LITTLE_LAW,
    /** 운영 시설 수와 대표 처리율로 가상의 총 처리용량을 산정한다. */
    CAPACITY_MODEL,
    /** 유입률과 처리용량이 유지된다고 가정하는 연속량 기반의 큐 감소 근사. */
    FLUID_APPROXIMATION,
    /** 완료 인원·처리 중 시간 등 실제 관측량의 합계나 단위 변환. */
    OBSERVED_FLOW,
    /** 큐에 들어온 사람과 나간 사람의 인원 보존 관계. */
    CONSERVATION,
    /** 필요한 총 시설 수와 해당 큐에 배정 가능한 최대 시설 수를 비교한다. */
    CAPACITY_COMPARISON,
    /** M/M/s 정상상태 모형으로 대기확률과 이론 평균값을 추정한다. */
    ERLANG_C,
    /** 기준시각의 대기 순번과 총 처리능력으로 그 시각 도착자의 대기를 구한다. */
    QUEUE_POSITION
}
