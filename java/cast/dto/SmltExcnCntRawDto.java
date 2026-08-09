package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** TH_PM_SMLT_EXCN_HSTRY 수행 현황 집계 1행 — 모니터링 상단 KPI 원형 */
@Getter
@Setter
public class SmltExcnCntRawDto {
	private int totCnt; // 전체 수행 (건)
	private int doneCnt; // 완료 (건)
	private int runningCnt; // 진행중 (건)
	private int avgExecSec; // 완료 건의 평균 수행시간 (초)
}
