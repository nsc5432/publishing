package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;

/**
 * @Classname : ChknQueueInterval.java
 * @Description : 아일랜드 공용 Queue 계산의 원천 구간 1칸 (CAST 결과 시각 단위)
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
public final class ChknQueueInterval {
	private final int bgnMinute;
	private final int durationMin;
	private final int observedQueue;
	private final int observedProcessed;
	private final BigDecimal avgPrcsSec;
	private final int activeBoothCnt;

	public ChknQueueInterval(
			int bgnMinute,
			int durationMin,
			int observedQueue,
			int observedProcessed,
			BigDecimal avgPrcsSec,
			int activeBoothCnt
	) {
		if (durationMin <= 0) {
			throw new IllegalArgumentException("durationMin must be positive");
		}

		this.bgnMinute = bgnMinute;
		this.durationMin = durationMin;
		this.observedQueue = observedQueue;
		this.observedProcessed = observedProcessed;
		this.avgPrcsSec = avgPrcsSec;
		this.activeBoothCnt = activeBoothCnt;
	}

	public int getBgnMinute() {
		return bgnMinute;
	}

	public int getDurationMin() {
		return durationMin;
	}

	public int getObservedQueue() {
		return observedQueue;
	}

	public int getObservedProcessed() {
		return observedProcessed;
	}

	/** 원천에 평균 처리시간이 없으면 null — 계산기가 fallback 순서를 탄다 */
	public BigDecimal getAvgPrcsSec() {
		return avgPrcsSec;
	}

	/** 이 구간에 대기 또는 처리 결과가 있던 부스 수 */
	public int getActiveBoothCnt() {
		return activeBoothCnt;
	}
}
