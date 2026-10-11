package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.service.FcltRecommendationCalculator;

/**
 * @Classname : ChknQueueDay.java
 * @Description : 체크인 하루치 Queue
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
public final class ChknQueueDay {
	public static final int RECOMMEND_SPAN_MIN = 60;
	private static final int RECOMMEND_LEAD_MIN = 10;
	private static final String TMNL_ISLAND = "*";

	private final Map<String, ChknQueueSeries> seriesMap;
	private final ChknQueueSeries tmnlSeries;
	private final CgnGradeScale gradeScale;

	public ChknQueueDay(Map<String, ChknQueueSeries> seriesMap, CgnGradeScale gradeScale) {
		this.seriesMap = new LinkedHashMap<>(seriesMap);
		this.tmnlSeries = ChknQueueSeries.merge(TMNL_ISLAND, new ArrayList<>(seriesMap.values()));
		this.gradeScale = gradeScale;
	}

	public List<String> islandCdList() {
		return new ArrayList<>(seriesMap.keySet());
	}

	public ChknQueueSeries tmnlSeries() {
		return tmnlSeries;
	}

	public ChknQueueSlot slotOf(String island, int bgnMinute, int minutes) {
		ChknQueueSeries series = seriesMap.get(island);

		return series == null ? ChknQueueSlot.EMPTY : series.slotOf(bgnMinute, minutes);
	}

	public CongestionStatus statusOf(int queuePsgCnt, String context) {
		return gradeScale.statusOf(queuePsgCnt, context);
	}

	public List<String> warningList() {
		return tmnlSeries.getWarningList();
	}

	public ChknQueueRecommend recommendOf(String island, int bgnMinute, int slotMin) {
		ChknQueueSeries series = seriesMap.get(island);

		if (series == null) {
			return ChknQueueRecommend.NONE;
		}

		int anchorMinute = bgnMinute + slotMin - 1;
		List<FcltRecommendationCalculator.QueuePoint> trajectory =
				series.trajectoryOf(anchorMinute, RECOMMEND_SPAN_MIN);
		BigDecimal serviceRate = series.serviceRateOf(anchorMinute, RECOMMEND_SPAN_MIN);
		int openCount = series.boothCntAt(anchorMinute);

		if (trajectory.isEmpty() || serviceRate == null || serviceRate.signum() <= 0 || openCount <= 0) {
			return ChknQueueRecommend.NONE;
		}

		FcltRecommendationCalculator.QueuePoint peak = peakOf(trajectory);

		try {
			FcltRecommendationCalculator.Result result = FcltRecommendationCalculator.calculate(
					BigDecimal.valueOf(peak.getQueue()),
					BigDecimal.valueOf(peak.getMinutesFromBgn()),
					serviceRate,
					gradeScale.getNormalMax(),
					openCount,
					trajectory
			);

			return new ChknQueueRecommend(result.getReqCnt(), result.getClearMinutes());
		} catch (IllegalArgumentException | IllegalStateException exception) {
			return ChknQueueRecommend.NONE;
		}
	}

	/*
	 * 피크는 리드타임 이후에서 찾는다 — 부스를 여는 데 걸리는 시간 안의 피크를 목표로 삼으면
	 * 나눌 분이 거의 0 이라 소요 수량이 끝없이 커진다. 구간이 자정에 잘려 리드타임 뒤가 비면
	 * 남은 궤적에서 찾고, 동률이면 이른 시각을 택해 안전측으로 산정한다.
	 */
	private FcltRecommendationCalculator.QueuePoint peakOf(
			List<FcltRecommendationCalculator.QueuePoint> trajectory) {
		FcltRecommendationCalculator.QueuePoint result = null;

		for (FcltRecommendationCalculator.QueuePoint point : trajectory) {
			if (point.getMinutesFromBgn() < RECOMMEND_LEAD_MIN) {
				continue;
			}

			if (result == null || point.getQueue() > result.getQueue()) {
				result = point;
			}
		}

		return result != null ? result : trajectory.get(trajectory.size() - 1);
	}
}
