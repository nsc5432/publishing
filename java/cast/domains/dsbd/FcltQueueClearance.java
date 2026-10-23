package aoms.pm.cast.domains.dsbd;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

import lombok.Getter;

import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.ErlangCResult;
import aoms.pm.cast.domains.queue.FacilityQueueCalculator;
import aoms.pm.cast.domains.queue.FacilityQueueInput;

/**
 * @Classname : FcltQueueClearance.java
 * @Description : 한 큐 / 한 관측구간의 혼잡해소 평가 — 요약보기 카드 / 혼잡해소 팝업 / 체크인 추천 공용
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 17. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class FcltQueueClearance {
	public static final int DFLT_TARGET_MIN = 30; // 목표 해소시간 기본값(분)

	private static final double SEC_PER_MIN = 60.0;
	private static final double MAX_CLEAR_SEC = 24 * 60 * SEC_PER_MIN; // 혼잡해소 시각으로 표기할 상한(초) = 하루(86400초), 넘으면 빈 값

	private final FcltQueueSource source;
	private final int targetQueueCnt;
	private final FacilityQueueCalculator calculator;
	private final Computed<Double> arrival;
	private final Computed<Double> service;

	public FcltQueueClearance(FcltQueueSource source, int targetQueueCnt) {
		this.source = source;
		this.targetQueueCnt = targetQueueCnt;
		this.calculator = toCalculator(source);
		this.arrival = calculator.estimateArrivalRateByQueueBalance(source.toArrivalInput());
		this.service = calculator.estimateServiceRatePerHour();
	}

	/** 혼잡등급 NORMAL 상한(양끝 포함)의 정수 내림. int 범위를 넘으면 null */
	public static Integer toTargetQueueCnt(BigDecimal normalMax) {
		BigDecimal floor = normalMax.setScale(0, RoundingMode.FLOOR);

		return floor.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0 ? null : floor.intValueExact();
	}

	public FcltQueueSource getSource() {
		return source;
	}

	public int getTargetQueueCnt() {
		return targetQueueCnt;
	}

	// 유입률 lambda (명/시간)
	public Computed<Double> getArrival() {
		return arrival;
	}

	// 시설 1개 처리율 mu (명/시간)
	public Computed<Double> getService() {
		return service;
	}

	// 현재 운영 수량 기준 부하율 rho
	public Computed<Double> getLoadRatio() {
		return calculator.estimateLoadRatio(inputOf(source.getOprCnt()));
	}

	// 관측구간 처리완료 인원의 시간당 환산 (명/시간)
	public Computed<Double> getThroughputPerHour() {
		return calculator.getObservedThroughputPerHour(inputOf(source.getOprCnt()));
	}

	// 지정한 운영 수량으로 목표 대기인원까지의 해소시간
	public ClearanceResult clearOf(Integer serverCnt) {
		FacilityQueueInput input = inputOf(serverCnt);
		Computed<Double> clearSec = calculator.estimateClearTimeSec(input, targetQueueCnt);

		return new ClearanceResult(
            serverCnt,
            clearSec,
            clearSec.hasValue() ? toClearDt(source.getObsEndDt(), clearSec.getValue()) : null,
            calculator.estimateNextArrivalWaitSec(input),
            calculator.analyzeErlangC(input)
        );
	}

	/** 지정한 목표 시간으로 목표 대기인원까지 줄이는 데 필요한 운영 수량 */
	public Recommend recommendOf(int targetMin) {
		double targetSec = targetMin * SEC_PER_MIN;
		Computed<Integer> flowBasedReqCnt = calculator.estimateRequiredServerCnt(inputOf(source.getOprCnt()), targetQueueCnt, targetSec);
		Integer stableMinCnt = toStableMinCnt();

		if (!flowBasedReqCnt.hasValue()) {
			return new Recommend(targetMin, flowBasedReqCnt, stableMinCnt, null, null, null);
		}

		// 기존 flowBasedReqCnt 추천의 의미는 바꾸지 않고, 양의 유입에서 rho < 1 이 되도록 이번 정책으로만 하한을 둔다
		int reqCnt = stableMinCnt == null ? flowBasedReqCnt.getValue() : Math.max(flowBasedReqCnt.getValue(), stableMinCnt);
		ClearanceResult reqClear = clearOf(reqCnt);
		Boolean goalMet = reqClear.getClearSec().hasValue() ? reqClear.getClearSec().getValue() <= targetSec : null;

		return new Recommend(targetMin, flowBasedReqCnt, stableMinCnt, reqCnt, reqClear, goalMet);
	}

	private FacilityQueueInput inputOf(Integer serverCnt) {
		return source.toScenarioInput(arrival, serverCnt);
	}

	private Integer toStableMinCnt() {
		if (!arrival.hasValue()) {
			return null;
		}

		if (arrival.getValue() == 0) {
			return 0;
		}

		if (!service.hasValue()) {
			return null;
		}

		double floor = Math.floor(arrival.getValue() / service.getValue());

		return Double.isFinite(floor) && floor < Integer.MAX_VALUE ? (int) floor + 1 : null;
	}

	private static LocalDateTime toClearDt(LocalDateTime baseDt, double clearSec) {
		return clearSec > MAX_CLEAR_SEC ? null : baseDt.plusSeconds((long) Math.ceil(clearSec));
	}

	private static FacilityQueueCalculator toCalculator(FcltQueueSource source) {
		String fcltType = source.getFcltType().getValue();

		return FacilityQueueCalculator.builder()
				.tmnlId(source.getTmnlId().getValue())
				.fcltType(fcltType)
				.fcltId(source.getUnitCd())
				.queueId(fcltType + "-" + source.getUnitCd())
				.intervalStart(source.getObsBgnDt())
				.intervalEnd(source.getObsEndDt())
				.source(source.getDataSrc())
				.avgPrcsTimeSec(source.getAvgPrcsSec())
				.avgWtngTimeSec(source.getAvgWtngSec())
				.avgQueuePsgCnt(source.getAvgQueuePsgCnt())
				.queuePsgCntAtEnd(source.getQueueAtEnd())
				.build();
	}

	/** 지정한 운영 수량으로 계산한 해소시간 */
	@Getter
	public static final class ClearanceResult {
		private final Integer serverCnt;
		private final Computed<Double> clearSec;
		/** 기준시각 + 해소 초(올림). 산정 불가 / 해소 불가 / 하루 초과면 null */
		private final LocalDateTime clearDt;
		private final Computed<Double> nextWtngSec;
		private final Computed<ErlangCResult> erlang;

		private ClearanceResult(
				Integer serverCnt,
				Computed<Double> clearSec,
				LocalDateTime clearDt,
				Computed<Double> nextWtngSec,
				Computed<ErlangCResult> erlang
		) {
			this.serverCnt = serverCnt;
			this.clearSec = clearSec;
			this.clearDt = clearDt;
			this.nextWtngSec = nextWtngSec;
			this.erlang = erlang;
		}

		/** 해소 분(올림). clearDt 가 null 이면 null */
		public Integer getClearMin() {
			return clearDt == null ? null : (int) Math.ceil(clearSec.getValue() / SEC_PER_MIN);
		}
	}

	@Getter
	public static final class Recommend {
		private final int targetMin;
		private final Computed<Integer> flowBasedReqCnt;
		private final Integer stableMinCnt;
		/** 최종 총 소요 수량 (현재 운영분 포함). 산정 불가면 null */
		private final Integer reqCnt;
		/** 추천 수량을 적용했을 때의 해소 결과. reqCnt 가 null 이면 null */
		private final ClearanceResult reqClear;
		/** 추천 수량의 해소시간이 목표 이내인지. 검증할 수 없으면 null */
		private final Boolean goalMet;

		private Recommend(int targetMin, Computed<Integer> flowBasedReqCnt, Integer stableMinCnt, Integer reqCnt, ClearanceResult reqClear, Boolean goalMet) {
			this.targetMin = targetMin;
			this.flowBasedReqCnt = flowBasedReqCnt;
			this.stableMinCnt = stableMinCnt;
			this.reqCnt = reqCnt;
			this.reqClear = reqClear;
			this.goalMet = goalMet;
		}
	}
}
