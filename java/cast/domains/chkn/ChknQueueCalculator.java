package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Queue;

/**
 * @Classname : ChknQueueCalculator.java
 * @Description : 부스별 결과를 아일랜드 공용 Queue 로 접는 상태 없는 계산기
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
public final class ChknQueueCalculator {
	private static final int MINUTE_PER_DAY = ChknQueueSeries.MINUTE_PER_DAY;
	private static final int SEC_PER_MIN = 60;
	private static final int PRCS_SEC_LOOKBACK_MIN = 60;
	private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;

	private ChknQueueCalculator() {
		throw new UnsupportedOperationException("ChknQueueCalculator Class is Utility class.");
	}

	/**
	 * @param assignedBoothCnt 분 단위 배정 부스 수 (길이 1440)
	 * @param fallbackPrcsSec 터미널 CC 처리인원 가중평균 처리시간 (fallback)
	 */
	public static ChknQueueSeries calculate(
        String island,
        List<ChknQueueInterval> intervalList,
        int[] assignedBoothCnt,
        BigDecimal fallbackPrcsSec
	) {
		int[] queue = new int[MINUTE_PER_DAY];
		int[] processed = new int[MINUTE_PER_DAY];
		int[] boothCnt = Arrays.copyOf(assignedBoothCnt, MINUTE_PER_DAY);
		int[] capacity = new int[MINUTE_PER_DAY];
		long[] waitMinSum = new long[MINUTE_PER_DAY];
		long[] prcsSecSum = new long[MINUTE_PER_DAY];
		long[] waitDistribution = new long[MINUTE_PER_DAY + 1];
		List<String> warningList = new ArrayList<>();

		List<ChknQueueInterval> intervalListByBgnMinute = new ArrayList<>(intervalList);
		intervalListByBgnMinute.sort(Comparator.comparingInt(ChknQueueInterval::getBgnMinute));

		Queue<int[]> arrivalGroupQueue = new ArrayDeque<>();
		BigDecimal carry = BigDecimal.ZERO;
		int running = 0;
		int previousWtngEndPsgCnt = 0;

		for (int index = 0; index < intervalListByBgnMinute.size(); index++) {
			ChknQueueInterval interval = intervalListByBgnMinute.get(index);
			int bgn = Math.max(interval.getBgnMinute(), 0);
			int end = Math.min(interval.getBgnMinute() + interval.getDurationMin(), MINUTE_PER_DAY);

			int arrivalsRaw = interval.getWtngEndPsgCnt() - previousWtngEndPsgCnt + interval.getIntvPrcsPsgCnt();
			previousWtngEndPsgCnt = interval.getWtngEndPsgCnt();

			if (arrivalsRaw < 0) {
				String message = String.format(
                    "대기인원 역산이 음수라 0 으로 보정했습니다. arrivals=%d, wtngEndPsgCnt=%d, intvPrcsPsgCnt=%d",
                    arrivalsRaw, interval.getWtngEndPsgCnt(), interval.getIntvPrcsPsgCnt()
                );

				warningList.add(warning(island, interval, message));
			}

			if (bgn >= end) {
				continue;
			}

			if (interval.getActiveBoothCnt() > assignedBoothCnt[bgn]) {
				String message = String.format(
                    "배정 시간 밖 부스에 결과가 있어 운영 부스로 포함했습니다. activeBoothCnt=%d, assignedBoothCnt=%d",
                    interval.getActiveBoothCnt(), assignedBoothCnt[bgn]
                );

				warningList.add(warning(island, interval, message));
			}

			BigDecimal prcsSec = resolvePrcsSec(intervalListByBgnMinute, index, fallbackPrcsSec);

			if (prcsSec == null && interval.getIntvPrcsPsgCnt() <= 0 && (arrivalsRaw > 0 || running > 0)) {
				warningList.add(warning(island, interval, "평균 처리시간을 찾지 못해 처리용량을 0 으로 둡니다."));
			}

			int arrivals = Math.max(0, arrivalsRaw);
			int arrivalBase = arrivals / interval.getDurationMin();
			int arrivalRemainder = arrivals % interval.getDurationMin();

			for (int minute = bgn; minute < end; minute++) {
				int booth = Math.max(assignedBoothCnt[minute], interval.getActiveBoothCnt());
				boothCnt[minute] = booth;

				BigDecimal capacityPerMin = capacityPerMin(interval, prcsSec, booth);
				carry = carry.add(capacityPerMin, MATH_CONTEXT);

				int serveCapacity = carry.setScale(0, RoundingMode.FLOOR).intValueExact();
				carry = carry.subtract(BigDecimal.valueOf(serveCapacity));
				capacity[minute] = serveCapacity;

				int arrival = arrivalBase + (minute - bgn < arrivalRemainder ? 1 : 0);

				if (arrival > 0) {
					arrivalGroupQueue.add(new int[] { minute, arrival });
					running += arrival;
				}

				int served = Math.min(running, serveCapacity);
				long waitSum = 0;
				int rest = served;

				while (rest > 0) {
					int[] arrivalGroup = arrivalGroupQueue.peek();
					int take = Math.min(rest, arrivalGroup[1]);
					int wait = minute - arrivalGroup[0];

					waitSum += (long) wait * take;
					waitDistribution[Math.min(wait, MINUTE_PER_DAY)] += take;
					arrivalGroup[1] -= take;
					rest -= take;

					if (arrivalGroup[1] == 0) {
						arrivalGroupQueue.poll();
					}
				}

				running -= served;
				processed[minute] = served;
				waitMinSum[minute] = waitSum;
				prcsSecSum[minute] = (long) served * effectivePrcsSec(capacityPerMin, booth);
				queue[minute] = running;
			}
		}

		return new ChknQueueSeries(
				island, queue, processed, boothCnt, capacity, waitMinSum, prcsSecSum, waitDistribution, warningList);
	}

	private static BigDecimal capacityPerMin(ChknQueueInterval interval, BigDecimal prcsSec, int boothCnt) {
		if (prcsSec != null && boothCnt > 0) {
			return BigDecimal.valueOf((long) boothCnt * SEC_PER_MIN).divide(prcsSec, MATH_CONTEXT);
		}

		if (interval.getIntvPrcsPsgCnt() > 0) {
			return BigDecimal.valueOf(interval.getIntvPrcsPsgCnt())
					.divide(BigDecimal.valueOf(interval.getDurationMin()), MATH_CONTEXT);
		}

		return BigDecimal.ZERO;
	}

	private static int effectivePrcsSec(BigDecimal capacityPerMin, int boothCnt) {
		if (capacityPerMin.signum() <= 0 || boothCnt <= 0) {
			return 0;
		}

		return BigDecimal.valueOf((long) boothCnt * SEC_PER_MIN)
				.divide(capacityPerMin, 0, RoundingMode.HALF_UP)
				.intValueExact();
	}

	private static BigDecimal resolvePrcsSec(
        List<ChknQueueInterval> intervalList, int index, BigDecimal fallbackPrcsSec
    ) {
		ChknQueueInterval interval = intervalList.get(index);

		if (isPositive(interval.getAvgPrcsSec())) {
			return interval.getAvgPrcsSec();
		}

        // 가중평균으로 대체
		BigDecimal weightedSum = BigDecimal.ZERO;
		int processedSum = 0;

		for (int prior = index - 1; prior >= 0; prior--) {
			ChknQueueInterval priorInterval = intervalList.get(prior);

			if (priorInterval.getBgnMinute() < interval.getBgnMinute() - PRCS_SEC_LOOKBACK_MIN) {
				break;
			}

			if (!isPositive(priorInterval.getAvgPrcsSec()) || priorInterval.getIntvPrcsPsgCnt() <= 0) {
				continue;
			}

			weightedSum = weightedSum.add(
					priorInterval.getAvgPrcsSec().multiply(
							BigDecimal.valueOf(priorInterval.getIntvPrcsPsgCnt()), MATH_CONTEXT),
					MATH_CONTEXT);
			processedSum += priorInterval.getIntvPrcsPsgCnt();
		}

		if (processedSum > 0) {
			return weightedSum.divide(BigDecimal.valueOf(processedSum), MATH_CONTEXT);
		}

		return isPositive(fallbackPrcsSec) ? fallbackPrcsSec : null;
	}

	private static boolean isPositive(BigDecimal value) {
		return value != null && value.signum() > 0;
	}

	private static String warning(String island, ChknQueueInterval interval, String message) {
		return "island=" + island + ", bgnMinute=" + interval.getBgnMinute() + ", " + message;
	}
}
