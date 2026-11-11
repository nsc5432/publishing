package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;

/**
 * @Classname : ChknQueueInterval.java
 * @Description : 아일랜드 공용 Queue 계산의 원천 구간 1칸
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
	private final int bgnMinute; // 구간 시작시각 
	private final int durationMin; // 구간 길이
	private final int wtngEndPsgCnt; // 구간 끝 대기인원
	private final int intvPrcsPsgCnt; // 구간 처리인원
	private final BigDecimal avgPrcsSec; // 평균처리시간
	private final int activeBoothCnt; // 부스갯수
	private final boolean tail;

	public ChknQueueInterval(
        int bgnMinute,
        int durationMin,
        int wtngEndPsgCnt,
        int intvPrcsPsgCnt,
        BigDecimal avgPrcsSec,
        int activeBoothCnt
	) {
		this(bgnMinute, durationMin, wtngEndPsgCnt, intvPrcsPsgCnt, avgPrcsSec, activeBoothCnt, false);
	}

	private ChknQueueInterval(
        int bgnMinute,
        int durationMin,
        int wtngEndPsgCnt,
        int intvPrcsPsgCnt,
        BigDecimal avgPrcsSec,
        int activeBoothCnt,
        boolean tail
	) {
		if (durationMin <= 0) {
			throw new IllegalArgumentException("durationMin 은 양수입니다: " + durationMin);
		}

		this.bgnMinute = bgnMinute;
		this.durationMin = durationMin;
		this.wtngEndPsgCnt = wtngEndPsgCnt;
		this.intvPrcsPsgCnt = intvPrcsPsgCnt;
		this.avgPrcsSec = avgPrcsSec;
		this.activeBoothCnt = activeBoothCnt;
		this.tail = tail;
	}

	// 결과가 없어 활성 부스를 알 수 없는 꼬리 구간 — 남은 Queue 를 배정 부스로 흘려보낸다
	public static ChknQueueInterval tail(int bgnMinute, int durationMin, int wtngEndPsgCnt) {
		return new ChknQueueInterval(bgnMinute, durationMin, wtngEndPsgCnt, 0, null, 0, true);
	}

	public int getBgnMinute() {
		return bgnMinute;
	}

	public int getDurationMin() {
		return durationMin;
	}

	public int getWtngEndPsgCnt() {
		return wtngEndPsgCnt;
	}

	public int getIntvPrcsPsgCnt() {
		return intvPrcsPsgCnt;
	}

	public BigDecimal getAvgPrcsSec() {
		return avgPrcsSec;
	}

	public int getActiveBoothCnt() {
		return activeBoothCnt;
	}

	public boolean isTail() {
		return tail;
	}
}
