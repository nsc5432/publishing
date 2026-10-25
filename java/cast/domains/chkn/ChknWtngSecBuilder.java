package aoms.pm.cast.domains.chkn;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;

/**
 * @Classname : ChknWtngSecBuilder.java
 * @Description : 아일랜드 공용 Queue 의 1분 계산 결과를 10분 기본 통계로 묶는다
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class ChknWtngSecBuilder {
	private static final int SEC_MIN = FcltWtngSecs.SEC_MIN;
	private static final int MINUTE_PER_DAY = ChknQueueSeries.MINUTE_PER_DAY;
	private static final int SEC_PER_MIN = 60;

	private ChknWtngSecBuilder() {
		throw new UnsupportedOperationException("ChknWtngSecBuilder Class is Utility class.");
	}

	/** 저장 범위 시작 — 계산 시작 분을 10분 경계로 내린 시각. 값이 없는 앞부분은 만들지 않는다 */
	public static LocalDateTime rangeStartOf(LocalDate baseDate, int originMinute) {
		return baseDate.atStartOfDay().plusMinutes(FcltWtngSecs.floorSecMinute(originMinute));
	}

	public static LocalDateTime rangeEndOf(LocalDate baseDate) {
		return baseDate.atStartOfDay().plusMinutes(MINUTE_PER_DAY);
	}

	/** 아일랜드마다 [계산 시작 경계, 대상일 24:00) 의 연속 10분 행 */
	public static Map<String, List<FcltWtngSec>> build(ChknQueueTmnlSeries tmnlSeries) {
		LocalDateTime dayStart = tmnlSeries.getBaseDate().atStartOfDay();
		int firstBgn = FcltWtngSecs.floorSecMinute(tmnlSeries.getOriginMinute());
		Map<String, List<FcltWtngSec>> result = new LinkedHashMap<>();

		tmnlSeries.getSeriesMap().forEach((island, series) -> {
			List<FcltWtngSec> secList = new ArrayList<>();

			for (int bgn = firstBgn; bgn < MINUTE_PER_DAY; bgn += SEC_MIN) {
				secList.add(toSec(island, series, tmnlSeries, dayStart, bgn));
			}

			result.put(island, secList);
		});

		return result;
	}

	// queue[m] 은 m 분 처리 후 Queue 라 [b, e) 의 시작 Queue 는 queue[b-1], 종료 Queue 는 queue[e-1] 이다
	private static FcltWtngSec toSec(String island, ChknQueueSeries series, ChknQueueTmnlSeries tmnlSeries, LocalDateTime dayStart, int bgn) {
		int origin = tmnlSeries.getOriginMinute();
		int from = Math.max(bgn, origin);
		int end = bgn + SEC_MIN;
		long queueSum = 0;
		int maxQueue = 0;
		int arrivals = 0;
		int processed = 0;
		long waitMinSum = 0;
		long prcsSecSum = 0;
		long capacitySum = 0;
		long vldBoothMinuteSum = 0;
		int observedMinute = 0;

		for (int minute = from; minute < end; minute++) {
			int queue = series.queueAt(minute);
			int capacity = series.capacityAt(minute);

			queueSum += queue;
			maxQueue = Math.max(maxQueue, queue);
			arrivals += series.arrivalAt(minute);
			processed += series.processedAt(minute);
			waitMinSum += series.waitMinSumAt(minute);
			prcsSecSum += series.prcsSecSumAt(minute);
			capacitySum += capacity;

			if (capacity > 0) {
				vldBoothMinuteSum += series.boothCntAt(minute);
			}

			if (tmnlSeries.isCovered(minute)) {
				observedMinute++;
			}
		}

		return FcltWtngSec.builder()
				.unitCd(island)
				.secBgngDt(dayStart.plusMinutes(bgn))
				.bgngWtngPsgCnt(bgn > origin ? series.queueAt(bgn - 1) : null)
				.endWtngPsgCnt(series.queueAt(end - 1))
				.arrPsgCnt(bgn >= origin ? arrivals : null)
				.prcsPsgCnt(processed)
				.wtngPsecSum((double) waitMinSum * SEC_PER_MIN)
				.wtngVldPsgCnt(processed)
				.prcsPsecSum(prcsSecSum)
				.prcsVldPsgCnt(processed)
				.wtngPsgCntSum(queueSum)
				.wtngNocs(end - from)
				.maxWtngPsgCnt(maxQueue)
				.bgngOperCntom(bgn >= origin ? series.boothCntAt(bgn) : null)
				.endOperCntom(series.boothCntAt(end - 1))
				.prcsCpct(capacitySum)
				.prcsVldOperCntomSum(vldBoothMinuteSum)
				.obsrvnMntCnt(observedMinute)
				.obsrvn(observedMinute == SEC_MIN)
				.obsrvnRsn(observedMinute == SEC_MIN ? null : reasonOf(origin, bgn, observedMinute))
				.build();
	}

	private static String reasonOf(int origin, int bgn, int observedMinute) {
		if (bgn < origin) {
			return "계산 시작(" + origin + "분) 이전 " + (origin - bgn) + "분이 포함된 구간입니다. 관측 " + observedMinute + "분";
		}

		return "터미널 CC 결과가 없는 분(결과 간격 또는 마지막 결과 뒤 꼬리 구간)이 " + (SEC_MIN - observedMinute) + "분 있습니다.";
	}
}
