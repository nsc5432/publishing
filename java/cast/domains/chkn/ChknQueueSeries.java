package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import aoms.pm.cast.service.FcltRecommendationCalculator;

/**
 * @Classname : ChknQueueSeries.java
 * @Description : 아일랜드 1곳의 하루치 공용 Queue 분 단위 궤적
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
public final class ChknQueueSeries {
	public static final int MINUTE_PER_DAY = 24 * 60;

	private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;
	private static final int SEC_PER_MIN = 60;
	private static final int PERCENT = 100;
	private static final BigDecimal P95 = new BigDecimal("0.95");

	private final String island;
	private final int[] queue;
	private final int[] processed;
	private final int[] boothCnt;
	private final int[] capacity;
	private final long[] waitMinSum;
	private final long[] prcsSecSum;
	private final long[] waitDistribution;
	private final List<String> warningList;

	ChknQueueSeries(
			String island,
			int[] queue,
			int[] processed,
			int[] boothCnt,
			int[] capacity,
			long[] waitMinSum,
			long[] prcsSecSum,
			long[] waitDistribution,
			List<String> warningList
	) {
		this.island = island;
		this.queue = queue;
		this.processed = processed;
		this.boothCnt = boothCnt;
		this.capacity = capacity;
		this.waitMinSum = waitMinSum;
		this.prcsSecSum = prcsSecSum;
		this.waitDistribution = waitDistribution;
		this.warningList = warningList;
	}

	/** 여러 아일랜드를 한 줄로 합친다 — 터미널 지표와 차트가 같은 궤적을 본다 */
	public static ChknQueueSeries merge(String island, List<ChknQueueSeries> seriesList) {
		int[] queue = new int[MINUTE_PER_DAY];
		int[] processed = new int[MINUTE_PER_DAY];
		int[] boothCnt = new int[MINUTE_PER_DAY];
		int[] capacity = new int[MINUTE_PER_DAY];
		long[] waitMinSum = new long[MINUTE_PER_DAY];
		long[] prcsSecSum = new long[MINUTE_PER_DAY];
		long[] waitDistribution = new long[MINUTE_PER_DAY + 1];
		List<String> warningList = new ArrayList<>();

		for (ChknQueueSeries series : seriesList) {
			for (int minute = 0; minute < MINUTE_PER_DAY; minute++) {
				queue[minute] += series.queue[minute];
				processed[minute] += series.processed[minute];
				boothCnt[minute] += series.boothCnt[minute];
				capacity[minute] += series.capacity[minute];
				waitMinSum[minute] += series.waitMinSum[minute];
				prcsSecSum[minute] += series.prcsSecSum[minute];
			}

			for (int wait = 0; wait <= MINUTE_PER_DAY; wait++) {
				waitDistribution[wait] += series.waitDistribution[wait];
			}

			warningList.addAll(series.warningList);
		}

		return new ChknQueueSeries(
				island, queue, processed, boothCnt, capacity, waitMinSum, prcsSecSum, waitDistribution, warningList);
	}

	public String getIsland() {
		return island;
	}

	public List<String> getWarningList() {
		return Collections.unmodifiableList(warningList);
	}

	public int queueAt(int minute) {
		return isInDay(minute) ? queue[minute] : 0;
	}

	public int boothCntAt(int minute) {
		return isInDay(minute) ? boothCnt[minute] : 0;
	}

	public ChknQueueSlot slotOf(int bgnMinute, int minutes) {
		int bgn = Math.max(bgnMinute, 0);
		int end = Math.min(bgnMinute + minutes, MINUTE_PER_DAY);

		if (bgn >= end) {
			return ChknQueueSlot.EMPTY;
		}

		long queueSum = 0;
		int maxQueue = 0;
		long processedSum = 0;
		long waitSum = 0;
		long prcsSum = 0;
		long capacitySum = 0;

		for (int minute = bgn; minute < end; minute++) {
			queueSum += queue[minute];
			maxQueue = Math.max(maxQueue, queue[minute]);
			processedSum += processed[minute];
			waitSum += waitMinSum[minute];
			prcsSum += prcsSecSum[minute];
			capacitySum += capacity[minute];
		}

		int minutes0 = end - bgn;

		return new ChknQueueSlot(
				queue[end - 1],
				Math.toIntExact(Math.round((double) queueSum / minutes0)),
				maxQueue,
				processedSum == 0 ? 0 : Math.toIntExact(Math.round((double) waitSum * SEC_PER_MIN / processedSum)),
				Math.toIntExact(processedSum),
				processedSum == 0 ? 0 : Math.toIntExact(Math.round((double) prcsSum / processedSum)),
				toUtilRate(processedSum, capacitySum),
				boothCnt[end - 1]);
	}

	/** 선택 시각부터 spanMin 분까지의 Queue 궤적 — 부스 추천이 읽는다 */
	public List<FcltRecommendationCalculator.QueuePoint> trajectoryOf(int bgnMinute, int spanMin) {
		List<FcltRecommendationCalculator.QueuePoint> result = new ArrayList<>();
		int bgn = Math.max(bgnMinute, 0);
		int end = Math.min(bgnMinute + spanMin, MINUTE_PER_DAY - 1);

		for (int minute = bgn; minute <= end; minute++) {
			result.add(new FcltRecommendationCalculator.QueuePoint(minute - bgnMinute, queue[minute]));
		}

		return result;
	}

	/**
	 * 부스 1대의 분당 처리량. 구간 전체의 처리용량을 부스·분으로 나눠 한 분의 흔들림을 지운다.
	 * 문을 연 부스가 없으면 산정할 수 없어 null 이다.
	 *
	 * 처리용량이 0 인 분은 빼고 센다 — 결과가 아직 없는 시각은 부스만 배정돼 있어
	 * 함께 세면 실제로 낼 수 있는 처리량이 낮게 잡힌다.
	 */
	public BigDecimal serviceRateOf(int bgnMinute, int spanMin) {
		int bgn = Math.max(bgnMinute, 0);
		int end = Math.min(bgnMinute + spanMin, MINUTE_PER_DAY);
		long capacitySum = 0;
		long boothMinuteSum = 0;

		for (int minute = bgn; minute < end; minute++) {
			if (capacity[minute] <= 0) {
				continue;
			}

			capacitySum += capacity[minute];
			boothMinuteSum += boothCnt[minute];
		}

		if (capacitySum <= 0 || boothMinuteSum <= 0) {
			return null;
		}

		return BigDecimal.valueOf(capacitySum).divide(BigDecimal.valueOf(boothMinuteSum), MATH_CONTEXT);
	}

	public ChknQueueKpi kpi() {
		long processedSum = 0;
		long waitSum = 0;
		long capacitySum = 0;
		int maxQueue = 0;
		int peakMinute = 0;

		for (int minute = 0; minute < MINUTE_PER_DAY; minute++) {
			processedSum += processed[minute];
			waitSum += waitMinSum[minute];
			capacitySum += capacity[minute];

			if (queue[minute] > maxQueue) {
				maxQueue = queue[minute];
				peakMinute = minute;
			}
		}

		return new ChknQueueKpi(
				processedSum == 0 ? 0 : Math.toIntExact(Math.round((double) waitSum / processedSum)),
				percentileWaitMin(processedSum),
				maxQueue,
				peakMinute,
				Math.toIntExact(processedSum),
				toUtilRate(processedSum, capacitySum));
	}

	private int percentileWaitMin(long processedSum) {
		if (processedSum <= 0) {
			return 0;
		}

		long target = BigDecimal.valueOf(processedSum)
				.multiply(P95, MATH_CONTEXT)
				.setScale(0, RoundingMode.CEILING)
				.longValueExact();
		long cumulative = 0;

		for (int wait = 0; wait < waitDistribution.length; wait++) {
			cumulative += waitDistribution[wait];

			if (cumulative >= target) {
				return wait;
			}
		}

		return waitDistribution.length - 1;
	}

	private int toUtilRate(long processedSum, long capacitySum) {
		if (capacitySum <= 0) {
			return 0;
		}

		return (int) Math.min(PERCENT, processedSum * PERCENT / capacitySum);
	}

	private boolean isInDay(int minute) {
		return minute >= 0 && minute < MINUTE_PER_DAY;
	}
}
