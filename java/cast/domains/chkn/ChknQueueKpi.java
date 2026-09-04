package aoms.pm.cast.domains.chkn;

/**
 * @Classname : ChknQueueKpi.java
 * @Description : 공용 Queue 의 당일 지표
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 04. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class ChknQueueKpi {
	private final int avgWaitMin;
	private final int p95WaitMin;
	private final int maxQueuePsgCnt;
	private final int peakMinute;
	private final int prcsPsgCnt;
	private final int utilRate;

	ChknQueueKpi(
			int avgWaitMin,
			int p95WaitMin,
			int maxQueuePsgCnt,
			int peakMinute,
			int prcsPsgCnt,
			int utilRate
	) {
		this.avgWaitMin = avgWaitMin;
		this.p95WaitMin = p95WaitMin;
		this.maxQueuePsgCnt = maxQueuePsgCnt;
		this.peakMinute = peakMinute;
		this.prcsPsgCnt = prcsPsgCnt;
		this.utilRate = utilRate;
	}

	public int getAvgWaitMin() {
		return avgWaitMin;
	}

	public int getP95WaitMin() {
		return p95WaitMin;
	}

	public int getMaxQueuePsgCnt() {
		return maxQueuePsgCnt;
	}

	/** 최대 Queue 가 선 시각 (자정 기준 분) */
	public int getPeakMinute() {
		return peakMinute;
	}

	public int getPrcsPsgCnt() {
		return prcsPsgCnt;
	}

	public int getUtilRate() {
		return utilRate;
	}
}
