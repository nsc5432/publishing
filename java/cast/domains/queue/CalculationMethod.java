package aoms.pm.cast.domains.queue;

public enum CalculationMethod {
    DIRECT, // 대기인원이 이미 목표 이하
    EXTERNAL_INPUT, // 외부에서 유입률을 직접 입력
    SERVICE_TIME, // 평균 처리시간으로 처리 인원을 추정 (ex. 1명 처리하는데 30초 처리시간이면 1분에 2명 처리)
    SERVICE_CAPACITY, // 운영시설수 와 처리율로 처리 인원을 추정 (ex. 3대 운영, 각 시설 처리율 2명/분 이면 1분에 6명 처리)
    LITTLE_LAW, // 시간평균 대기인원과 평균 대기시간의 관계 Lq = lambda * Wq
    OBSERVED_FLOW, // 유체 근사 방식 - 관측 구간 처리 완료 인원으로 처리량 추정 (ex. 30분에 200명 완료 -> 시간당 400명)
    FLOW_BALANCE, // 유입/처리 기준 -> 일정한 유입과 처리를 기반으로 해소 시간 추정 (ex. 1분에 2명 유입, 1분에 3명 처리면 1분에 1명 해소 -> 대기 10명이면 10분 뒤 해소)
    QUEUE_BALANCE, // 종료/시작 인원 기준 -> 유입인원 = 종료 대기인원 - (시작 대기인원 - 유출인원)
    ERLANG_C, // M/M/s 시스템 가정으로 대기확률, 평균 대기시간 구함
    NEXT_ARRIVAL_WAIT // 현재 대기인원과 처리율로 지금 도착한 여객의 대기시간 추정 ((현재 대기인원 + 1) ÷ 처리율)
}
