package aoms.pm.cast.domains.dsbd;

import java.time.LocalDateTime;
import java.util.List;

import aoms.pm.cast.domains.queue.FacilityQueueInput;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Builder;
import lombok.Getter;

/**
 * @Classname : FcltQueueSource.java
 * @Description : 혼잡해소 시나리오 팝업의 원천 어댑터 결과 — 한 큐 / 한 관측구간의 값
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 13. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Getter
@Builder(toBuilder = true)
public final class FcltQueueSource {
	private final TerminalKind tmnlId;
	private final FcltType fcltType;
	private final String unitCd;
	private final String fcltNm;
	private final QueueDataSource dataSrc;
	private final LocalDateTime obsBgnDt;
	/** Queue 스냅샷 시각 = 계산 기준시각 */
	private final LocalDateTime obsEndDt;
	private final Integer queueAtStart;
	private final Integer queueAtEnd;
	private final Integer wtngEndPsgCnt;
	private final Integer prcsPsgCnt;
	private final Double avgPrcsSec;
	private final Double avgQueuePsgCnt;
	private final Double avgWtngSec;
	private final Integer oprCnt;
	private final Integer totCnt;
	private final String totCntRsn;
	private final boolean erlangCApplicable;
	private final List<String> asmpList;

	public FacilityQueueInput toArrivalInput() {
		return FacilityQueueInput.builder()
				.queuePsgCntAtStart(queueAtStart)
				.wtngEndPsgCnt(wtngEndPsgCnt)
				.build();
	}

	public FacilityQueueInput toScenarioInput(Computed<Double> arrival, Integer serverCnt) {
		return FacilityQueueInput.builder()
				.oprServerCnt(serverCnt)
				.arrivalRatePerHour(arrival.hasValue() ? arrival.getValue() : null)
				.prcsPsgCnt(prcsPsgCnt)
				.arrivalRateEstimated(true)
				.erlangCApplicable(erlangCApplicable)
				.build();
	}
}
