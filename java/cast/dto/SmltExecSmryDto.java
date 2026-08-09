package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 모니터링 상단 KPI 카드 4종 */
@Getter
@Setter
public class SmltExecSmryDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private int totCnt; // 전체 수행 (건)
	private int doneCnt; // 완료 (건)
	private int runningCnt; // 진행중 (건)
	private int avgExecMin; // 평균 수행시간 (분)
	private int avgExecSec; // 평균 수행시간 (초)
}
