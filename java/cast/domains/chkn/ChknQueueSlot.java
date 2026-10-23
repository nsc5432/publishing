package aoms.pm.cast.domains.chkn;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Classname : ChknQueueSlot.java
 * @Description : 공용 Queue 를 화면 구간(30분 / 1시간)으로 접은 값
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
@Getter
@AllArgsConstructor(access = AccessLevel.PACKAGE)
public final class ChknQueueSlot {
	public static final ChknQueueSlot EMPTY = new ChknQueueSlot(0, 0, 0, 0, 0, 0, 0, 0);

	/** 구간 마지막 분의 Queue */
	private final int currentQueue;
	private final int avgQueue;
	private final int maxQueue;
	/** 구간 처리 여객의 가중평균 대기시간 */
	private final int avgWaitSec;
	private final int prcsPsgCnt;
	private final int avgPrcsSec;
	/** 처리용량 사용률 (0~100) */
	private final int prcsRate;
	/** 구간 마지막 분의 운영 부스 수 */
	private final int oprBoothCnt;
}
