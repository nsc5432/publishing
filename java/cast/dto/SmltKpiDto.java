package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltKpiDto {
	private int avgWaitMin; // 평균대기 (분) — AVG_WTNG_HR(초)를 분으로 환산
	private int p95WaitMin; // P95대기 (분) — 결과 상세 행 분포의 95백분위
	private int maxQueuePsgCnt; // 최대 큐인원 (명)
	private int utilRate; // 가동률 (%) — 운영 부스·출국장 시간 / 가용 시간
}
