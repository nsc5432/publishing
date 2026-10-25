package aoms.pm.cast.domains.wtng;

import java.time.LocalDateTime;

import lombok.Getter;

import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.ErlangCResult;
import aoms.pm.cast.domains.queue.FacilityQueueCalculator;
import aoms.pm.cast.domains.queue.FacilityQueueInput;
import aoms.pm.cast.domains.queue.QueueWaitWindow;
import aoms.pm.cast.domains.queue.WaitAvgForecast;

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

	private final FcltQueueSource source;
	private final FacilityQueueCalculator calculator;
	private final Computed<Double> arrival;
	private final Computed<Double> service;
	private final Computed<Double> observedWait;
	private final WaitAvgForecast forecast;

	/** @param normalUpperExclusiveSec 해소 목표 — 직전 30분 처리 여객 평균 대기시간이 이 값(초) 미만 */
	public FcltQueueClearance(FcltQueueSource source, int normalUpperExclusiveSec) {
		QueueWaitWindow window = source.getWaitWindow() != null
				? source.getWaitWindow()
				: QueueWaitWindow.unavailable("혼잡 판정 원천(직전 30분 처리 이력)이 없습니다.");

		this.source = source;
		this.calculator = toCalculator(source);
		this.arrival = calculator.estimateArrivalRateByQueueBalance(source.toArrivalInput());
		this.service = calculator.estimateServiceRatePerHour();
		this.observedWait = window.observedAvgWtngSec();
		this.forecast = new WaitAvgForecast(window, arrival, service, normalUpperExclusiveSec);
	}

	public FcltQueueSource getSource() {
		return source;
	}

	public int getNormalUpperExclusiveSec() {
		return forecast.getTargetExclusiveSec();
	}

	// 유입률 lambda (명/시간)
	public Computed<Double> getArrival() {
		return arrival;
	}

	// 시설 1개 처리율 mu (명/시간)
	public Computed<Double> getService() {
		return service;
	}

	// 직전 30분 처리 여객 평균 대기시간 (초) — 혼잡등급 판정값
	public Computed<Double> getObservedWait() {
		return observedWait;
	}

	// 현재 운영 수량 기준 부하율 rho
	public Computed<Double> getLoadRatio() {
		return calculator.estimateLoadRatio(inputOf(source.getOprCnt()));
	}

	// 시설 전체에 대한 처리율 (명/시간)
	public Computed<Double> getObservedPrcsPerHour() {
		return calculator.getObservedPrcsPerHour(inputOf(source.getOprCnt()));
	}

	/**
	 * 지정한 운영 수량으로 직전 30분 처리 여객 평균이 목표 미만이 되기까지의 시간.
	 * @param fcstMin 예측 평균을 보고할 시각 (기준시각 + 분)
	 */
	public ClearanceResult clearOf(Integer serverCnt, int fcstMin) {
		FacilityQueueInput input = inputOf(serverCnt);
		WaitAvgForecast.Projection projection = forecast.project(serverCnt, fcstMin, WaitAvgForecast.MAX_HORIZON_MIN);
		Computed<Double> clearSec = projection.getClearSec();

		return new ClearanceResult(
            serverCnt,
            clearSec,
            clearSec.hasValue() ? source.getObsEndDt().plusSeconds((long) Math.ceil(clearSec.getValue())) : null,
            fcstMin,
            projection.getFcstWtngSec(),
            calculator.estimateNextArrivalWaitSec(input),
            calculator.analyzeErlangC(input)
        );
	}

	/** 지정한 목표 시간 안에 평균 대기시간을 목표 미만으로 낮추고 처리능력이 유입보다 큰 총 운영 수량 */
	public Recommend recommendOf(int targetMin) {
		WaitAvgForecast.Search search = forecast.search(targetMin);
		Computed<Integer> reqMetric = search.getReqCnt();

		if (!reqMetric.hasValue()) {
			return new Recommend(targetMin, reqMetric, search.getStableMinCnt(), search.getGoalOnlyMinCnt(), null, null, null);
		}

		int reqCnt = reqMetric.getValue();

		return new Recommend(
            targetMin,
            reqMetric,
            search.getStableMinCnt(),
            search.getGoalOnlyMinCnt(),
            reqCnt,
            clearOf(reqCnt, targetMin),
            forecast.verify(reqCnt, targetMin)
        );
	}

	private FacilityQueueInput inputOf(Integer serverCnt) {
		return source.toScenarioInput(arrival, serverCnt);
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
		/** 평균 대기시간이 목표 미만이 되기까지의 초 (1분 해상도). 이미 미만이면 0 */
		private final Computed<Double> clearSec;
		/** 기준시각 + 해소 초. 산정 불가 / 해소 불가 / 예측 범위(하루) 초과면 null */
		private final LocalDateTime clearDt;
		private final int fcstMin;
		/** 기준시각 + fcstMin 의 직전 30분 처리 여객 예측 평균 대기시간 (초) */
		private final Computed<Double> fcstWtngSec;
		private final Computed<Double> nextWtngSec;
		private final Computed<ErlangCResult> erlang;

		private ClearanceResult(
				Integer serverCnt,
				Computed<Double> clearSec,
				LocalDateTime clearDt,
				int fcstMin,
				Computed<Double> fcstWtngSec,
				Computed<Double> nextWtngSec,
				Computed<ErlangCResult> erlang
		) {
			this.serverCnt = serverCnt;
			this.clearSec = clearSec;
			this.clearDt = clearDt;
			this.fcstMin = fcstMin;
			this.fcstWtngSec = fcstWtngSec;
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
		private final Computed<Integer> reqMetric;
		private final Integer stableMinCnt;
		/** 처리능력 > 유입 조건 없이 목표 시간만 만족하는 최소 수량. 없으면 null */
		private final Integer goalOnlyMinCnt;
		/** 최종 총 소요 수량 (현재 운영분 포함). 산정 불가면 null */
		private final Integer reqCnt;
		/** 추천 수량을 적용했을 때의 해소 결과. reqCnt 가 null 이면 null */
		private final ClearanceResult reqClear;
		/** 추천 수량을 다시 예측해 목표 시간 / 목표 시각 평균 / 안정 조건을 모두 만족하는지. 검증할 수 없으면 null */
		private final Boolean goalMet;

		private Recommend(
				int targetMin,
				Computed<Integer> reqMetric,
				Integer stableMinCnt,
				Integer goalOnlyMinCnt,
				Integer reqCnt,
				ClearanceResult reqClear,
				Boolean goalMet
		) {
			this.targetMin = targetMin;
			this.reqMetric = reqMetric;
			this.stableMinCnt = stableMinCnt;
			this.goalOnlyMinCnt = goalOnlyMinCnt;
			this.reqCnt = reqCnt;
			this.reqClear = reqClear;
			this.goalMet = goalMet;
		}
	}
}
