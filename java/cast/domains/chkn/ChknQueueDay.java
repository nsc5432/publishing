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
 * @Description : 터미널 하루치 공용 Queue — 대시보드 · 맵형태보기 · 체크인 상세가 함께 읽는다
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
	/** 추천 궤적 구간 — 선택 시각부터 향후 60분 */
	public static final int RECOMMEND_SPAN_MIN = 60;

	/** 부스를 더 열기까지 걸리는 시간. 이 앞의 피크는 어떤 수량으로도 막지 못한다 (대시보드와 같은 값) */
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

	/**
	 * 선택 슬롯의 Queue 를 향후 60분 안에 NORMAL 이하로 만드는 총 소요 부스 수.
	 * 운영 부스나 서비스율이 없어 산정할 수 없으면 값이 비어 화면이 '-' 로 그린다.
	 *
	 * 궤적은 슬롯 시작이 아니라 화면이 보여주는 값(구간 마지막 분의 Queue)에서 출발한다.
	 * 슬롯 시작에서 재면 아직 쌓이기 전이라 이미 해소된 것처럼 보인다.
	 */
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
					trajectory);

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
