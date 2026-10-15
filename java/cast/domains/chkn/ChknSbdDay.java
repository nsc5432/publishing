package aoms.pm.cast.domains.chkn;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 */
public final class ChknSbdDay {
	private final Map<String, int[]> queueMap;
	private final int[] processed;
	private final long[] waitSecSum;
	private final long[] prcsSecSum;

	public ChknSbdDay(
        Map<String, int[]> queueMap,
        int[] processed,
        long[] waitSecSum,
        long[] prcsSecSum
	) {
		this.queueMap = new LinkedHashMap<>();
		queueMap.forEach((island, queue) -> this.queueMap.put(island, queue.clone()));
		this.processed = processed.clone();
		this.waitSecSum = waitSecSum.clone();
		this.prcsSecSum = prcsSecSum.clone();
	}

	public List<String> islandCdList() {
		return new ArrayList<>(queueMap.keySet());
	}

	public int queueAt(String island, int minute) {
		int[] queue = queueMap.get(island);

		return queue == null || minute < 0 || minute >= ChknQueueSeries.MINUTE_PER_DAY ? 0 : queue[minute];
	}

	public int prcsPsgCnt(int bgnMinute, int minutes) {
		int bgn = Math.max(bgnMinute, 0);
		int end = Math.min(bgnMinute + minutes, ChknQueueSeries.MINUTE_PER_DAY);
		int result = 0;

		for (int minute = bgn; minute < end; minute++) {
			result += processed[minute];
		}

		return result;
	}

	public long waitSecSum(int bgnMinute, int minutes) {
		return sum(waitSecSum, bgnMinute, minutes);
	}

	public long prcsSecSum(int bgnMinute, int minutes) {
		return sum(prcsSecSum, bgnMinute, minutes);
	}

	private long sum(long[] values, int bgnMinute, int minutes) {
		int bgn = Math.max(bgnMinute, 0);
		int end = Math.min(bgnMinute + minutes, ChknQueueSeries.MINUTE_PER_DAY);
		long result = 0;

		for (int minute = bgn; minute < end; minute++) {
			result += values[minute];
		}

		return result;
	}
}
