package aoms.pm.cast.domains.chkn;

/**
 * @Classname : ChknQueueSlot.java
 * @Description : 공용 Queue 를 화면 구간(30분 · 1시간)으로 접은 값
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
public final class ChknQueueSlot {
	public static final ChknQueueSlot EMPTY = new ChknQueueSlot(0, 0, 0, 0, 0, 0, 0, 0);

	private final int currentQueue;
	private final int avgQueue;
	private final int maxQueue;
	private final int avgWaitSec;
	private final int prcsPsgCnt;
	private final int avgPrcsSec;
	private final int prcsRate;
	private final int oprBoothCnt;

	ChknQueueSlot(
			int currentQueue,
			int avgQueue,
			int maxQueue,
			int avgWaitSec,
			int prcsPsgCnt,
			int avgPrcsSec,
			int prcsRate,
			int oprBoothCnt
	) {
		this.currentQueue = currentQueue;
		this.avgQueue = avgQueue;
		this.maxQueue = maxQueue;
		this.avgWaitSec = avgWaitSec;
		this.prcsPsgCnt = prcsPsgCnt;
		this.avgPrcsSec = avgPrcsSec;
		this.prcsRate = prcsRate;
		this.oprBoothCnt = oprBoothCnt;
	}

	/** 구간 마지막 분의 Queue */
	public int getCurrentQueue() {
		return currentQueue;
	}

	public int getAvgQueue() {
		return avgQueue;
	}

	public int getMaxQueue() {
		return maxQueue;
	}

	/** 구간 처리 여객의 가중평균 대기시간 */
	public int getAvgWaitSec() {
		return avgWaitSec;
	}

	public int getPrcsPsgCnt() {
		return prcsPsgCnt;
	}

	public int getAvgPrcsSec() {
		return avgPrcsSec;
	}

	/** 처리용량 사용률 (0~100) */
	public int getPrcsRate() {
		return prcsRate;
	}

	/** 구간 마지막 분의 운영 부스 수 */
	public int getOprBoothCnt() {
		return oprBoothCnt;
	}
}
