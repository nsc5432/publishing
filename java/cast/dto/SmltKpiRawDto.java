package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltKpiRawDto {
	private int avgWtngHr; // 평균대기시간 (DB 단위 — 초)
	private int p95WtngHr; // 95백분위 대기시간 (초)
	private int maxWtngPsgCnt; // 최대 대기여객수 (명)
}
