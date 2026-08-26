package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltKpiDto {
	private int avgWaitMin; // 평균대기 (분)
	private int p95WaitMin; // P95대기 (분)
	private int maxQueuePsgCnt; // 최대 큐인원 (명)
	private int utilRate; // 가동률 (%)
}
