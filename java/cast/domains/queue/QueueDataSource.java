package aoms.pm.cast.domains.queue;

/**
 * 큐 관측값의 출처이다. 동일한 시설과 시각이어도 CAST 예측과 Xovis 실적은 별도 객체로 만든다.
 * 이 열거형은 학습용 도메인의 내부 타입이며 기존 서버 DTO의 enum 계약을 변경하지 않는다.
 */
public enum QueueDataSource {
    /** 시뮬레이션이 산출한 값. 원천 부스 결과는 Queue ID 기준으로 정규화한 후 입력한다. */
    CAST,
    /** 센서가 관측한 실적. 측정영역과 시간 집계 기준을 확인한 후 입력한다. */
    XOVIS,
    /** 계산 예제를 위한 수동 입력. 실제 예측·실적 데이터와 혼동하지 않도록 구분한다. */
    MANUAL
}
