package aoms.pm.cast.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.List;

public final class FcltRecommendationCalculator {
	private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;

	private FcltRecommendationCalculator() {
	}

	public static Result calculate(
			BigDecimal peakQueue,
			BigDecimal leadMinutes,
			BigDecimal serviceRatePerFacilityPerMin,
			BigDecimal targetQueue,
			int currentOpenCount,
			List<QueuePoint> trajectory
	) {
		requireNonNegative(peakQueue, "peakQueue");
		requirePositive(leadMinutes, "leadMinutes");
		requirePositive(serviceRatePerFacilityPerMin, "serviceRatePerFacilityPerMin");
		requireNonNegative(targetQueue, "targetQueue");

		if (currentOpenCount <= 0) {
			throw new IllegalArgumentException("currentOpenCount must be positive");
		}

		if (trajectory == null || trajectory.isEmpty()) {
			throw new IllegalArgumentException("trajectory must not be empty");
		}

		BigDecimal capacityPerFacility = serviceRatePerFacilityPerMin.multiply(leadMinutes, MATH_CONTEXT);
		BigDecimal excess = peakQueue.subtract(targetQueue);
		int extraCnt = excess.signum() <= 0
				? 0
				: excess.divide(capacityPerFacility, 0, RoundingMode.CEILING).intValueExact();
		BigDecimal predictedPeakQueue = peakQueue
				.subtract(capacityPerFacility.multiply(BigDecimal.valueOf(extraCnt), MATH_CONTEXT))
				.max(BigDecimal.ZERO);

		if (predictedPeakQueue.compareTo(targetQueue) > 0) {
			throw new IllegalStateException("추가 시설 수로 피크 대기인원을 목표 이하로 낮출 수 없습니다.");
		}

		BigDecimal drainPerMin = serviceRatePerFacilityPerMin
				.multiply(BigDecimal.valueOf(extraCnt), MATH_CONTEXT);

		for (QueuePoint point : trajectory) {
			BigDecimal drained = drainPerMin.multiply(BigDecimal.valueOf(point.getMinutesFromBgn()), MATH_CONTEXT);

			if (BigDecimal.valueOf(point.getQueue()).subtract(drained).compareTo(targetQueue) <= 0) {
				return new Result(currentOpenCount + extraCnt, extraCnt, predictedPeakQueue, point.getMinutesFromBgn());
			}
		}

		// 피크 시점의 보정 큐가 목표 이하임을 위에서 확인했으므로 도달할 수 없는 자리다
		throw new IllegalStateException("추가 시설 수로 목표 시간 안에 혼잡을 해소할 수 없습니다.");
	}

	private static void requireNonNegative(BigDecimal value, String name) {
		if (value == null || value.signum() < 0) {
			throw new IllegalArgumentException(name + " must be non-negative");
		}
	}

	private static void requirePositive(BigDecimal value, String name) {
		if (value == null || value.signum() <= 0) {
			throw new IllegalArgumentException(name + " must be positive");
		}
	}

	public static final class QueuePoint {
		private final int minutesFromBgn;
		private final int queue;

		public QueuePoint(int minutesFromBgn, int queue) {
			this.minutesFromBgn = minutesFromBgn;
			this.queue = queue;
		}

		public int getMinutesFromBgn() {
			return minutesFromBgn;
		}

		public int getQueue() {
			return queue;
		}
	}

	public static final class Result {
		private final int reqCnt;
		private final int extraCnt;
		private final BigDecimal predictedPeakQueue;
		private final int clearMinutes;

		private Result(int reqCnt, int extraCnt, BigDecimal predictedPeakQueue, int clearMinutes) {
			this.reqCnt = reqCnt;
			this.extraCnt = extraCnt;
			this.predictedPeakQueue = predictedPeakQueue;
			this.clearMinutes = clearMinutes;
		}

		public int getReqCnt() {
			return reqCnt;
		}

		public int getExtraCnt() {
			return extraCnt;
		}

		public BigDecimal getPredictedPeakQueue() {
			return predictedPeakQueue;
		}

		public int getClearMinutes() {
			return clearMinutes;
		}
	}
}
