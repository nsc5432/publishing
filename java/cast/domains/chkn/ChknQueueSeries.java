package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import aoms.pm.cast.domains.wtng.ChknQueueSlot;

/**
 * @Classname : ChknQueueSeries.java
 * @Description : 아일랜드 1곳의 하루치 공용 Queue 분 단위
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

	private final String island;
	/** 배열 0번 칸의 분 (당일 자정 기준, 0 이하) */
	private final int originMinute;
	private final int[] queue;
	private final int[] processed;
	private final int[] arrivals;
	private final int[] boothCnt;
	private final int[] capacity;
	private final long[] waitMinSum;
	private final long[] prcsSecSum;
	private final long[] waitDistribution;
	private final List<String> warningList;

	ChknQueueSeries(
        String island,
        int originMinute,
        int[] queue,
        int[] processed,
        int[] arrivals,
        int[] boothCnt,
        int[] capacity,
        long[] waitMinSum,
        long[] prcsSecSum,
        long[] waitDistribution,
        List<String> warningList
	) {
		this.island = island;
		this.originMinute = originMinute;
		this.queue = queue.clone();
		this.processed = processed.clone();
		this.arrivals = arrivals.clone();
		this.boothCnt = boothCnt.clone();
		this.capacity = capacity.clone();
		this.waitMinSum = waitMinSum.clone();
		this.prcsSecSum = prcsSecSum.clone();
		this.waitDistribution = waitDistribution.clone();
		this.warningList = warningList;
	}

	public static ChknQueueSeries merge(String island, int originMinute, List<ChknQueueSeries> seriesList) {
		int length = MINUTE_PER_DAY - originMinute;
		int[] queue = new int[length];
		int[] processed = new int[length];
		int[] arrivals = new int[length];
		int[] boothCnt = new int[length];
		int[] capacity = new int[length];
		long[] waitMinSum = new long[length];
		long[] prcsSecSum = new long[length];
		long[] waitDistribution = new long[MINUTE_PER_DAY];
		List<String> warningList = new ArrayList<>();

		for (ChknQueueSeries series : seriesList) {
			if (series.originMinute != originMinute) {
				throw new IllegalArgumentException("시작 분이 다른 Queue 는 합칠 수 없습니다. island=" + series.island
						+ ", originMinute=" + series.originMinute + ", expected=" + originMinute);
			}

			for (int at = 0; at < length; at++) {
				queue[at] += series.queue[at];
				processed[at] += series.processed[at];
				arrivals[at] += series.arrivals[at];
				boothCnt[at] += series.boothCnt[at];
				capacity[at] += series.capacity[at];
				waitMinSum[at] += series.waitMinSum[at];
				prcsSecSum[at] += series.prcsSecSum[at];
			}

			for (int wait = 0; wait < MINUTE_PER_DAY; wait++) {
				waitDistribution[wait] += series.waitDistribution[wait];
			}

			warningList.addAll(series.warningList);
		}

		return new ChknQueueSeries(island, originMinute, queue, processed, arrivals, boothCnt, capacity, waitMinSum, prcsSecSum, waitDistribution, warningList);
	}

	public String getIsland() {
		return island;
	}

	public int getOriginMinute() {
		return originMinute;
	}

	public List<String> getWarningList() {
		return Collections.unmodifiableList(warningList);
	}

	public int queueAt(int minute) {
		return isInRange(minute) ? queue[minute - originMinute] : 0;
	}

	public int processedAt(int minute) {
		return isInRange(minute) ? processed[minute - originMinute] : 0;
	}

	public int arrivalAt(int minute) {
		return isInRange(minute) ? arrivals[minute - originMinute] : 0;
	}

	public int boothCntAt(int minute) {
		return isInRange(minute) ? boothCnt[minute - originMinute] : 0;
	}

	public int capacityAt(int minute) {
		return isInRange(minute) ? capacity[minute - originMinute] : 0;
	}

	public long waitMinSumAt(int minute) {
		return isInRange(minute) ? waitMinSum[minute - originMinute] : 0;
	}

	public long prcsSecSumAt(int minute) {
		return isInRange(minute) ? prcsSecSum[minute - originMinute] : 0;
	}

	public ChknQueueSlot slotOf(int bgnMinute, int minutes) {
		int bgn = Math.max(bgnMinute, originMinute);
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

		for (int at = bgn - originMinute; at < end - originMinute; at++) {
			queueSum += queue[at];
			maxQueue = Math.max(maxQueue, queue[at]);
			processedSum += processed[at];
			waitSum += waitMinSum[at];
			prcsSum += prcsSecSum[at];
			capacitySum += capacity[at];
		}

		int minutes0 = end - bgn;
		int last = end - 1 - originMinute;

		return new ChknQueueSlot(
			queue[last],
			Math.toIntExact(Math.round((double) queueSum / minutes0)),
			maxQueue,
			processedSum == 0 ? 0 : Math.toIntExact(Math.round((double) waitSum * 60 / processedSum)),
			Math.toIntExact(processedSum),
			processedSum == 0 ? 0 : Math.toIntExact(Math.round((double) prcsSum / processedSum)),
			toUtilRate(processedSum, capacitySum),
			boothCnt[last]
		);
	}

	public ChknQueueKpi kpi() {
		long processedSum = 0;
		long waitSum = 0;
		long capacitySum = 0;
		int maxQueue = 0;
		int peakMinute = 0;

		for (int minute = 0; minute < MINUTE_PER_DAY; minute++) {
			int at = minute - originMinute;

			processedSum += processed[at];
			waitSum += waitMinSum[at];
			capacitySum += capacity[at];

			if (queue[at] > maxQueue) {
				maxQueue = queue[at];
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
				.multiply(new BigDecimal("0.95"), MathContext.DECIMAL128)
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

		return (int) Math.min(100, processedSum * 100 / capacitySum);
	}

	private boolean isInRange(int minute) {
		return minute >= originMinute && minute < MINUTE_PER_DAY;
	}
}
