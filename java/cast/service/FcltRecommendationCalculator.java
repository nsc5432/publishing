package aoms.pm.cast.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

public final class FcltRecommendationCalculator {
	private static final BigDecimal ZERO = BigDecimal.ZERO;
	private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;

	private FcltRecommendationCalculator() {
	}

	public static Result calculate(
			BigDecimal initialQueue,
			BigDecimal forecastArrivals,
			BigDecimal horizonMinutes,
			BigDecimal serviceRatePerFacilityPerMin,
			BigDecimal targetQueue
	) {
		requireNonNegative(initialQueue, "initialQueue");
		requireNonNegative(forecastArrivals, "forecastArrivals");
		requirePositive(horizonMinutes, "horizonMinutes");
		requirePositive(serviceRatePerFacilityPerMin, "serviceRatePerFacilityPerMin");
		requireNonNegative(targetQueue, "targetQueue");

		BigDecimal capacityPerFacility = serviceRatePerFacilityPerMin.multiply(horizonMinutes, MATH_CONTEXT);
		BigDecimal requiredCapacity = initialQueue.add(forecastArrivals).subtract(targetQueue);
		int requiredTotal = requiredCapacity.signum() <= 0
				? 0
				: requiredCapacity.divide(capacityPerFacility, 0, RoundingMode.CEILING).intValueExact();
		BigDecimal predictedQueue = initialQueue.add(forecastArrivals)
				.subtract(capacityPerFacility.multiply(BigDecimal.valueOf(requiredTotal), MATH_CONTEXT))
				.max(ZERO);

		if (predictedQueue.compareTo(targetQueue) > 0) {
			throw new IllegalStateException("추천 시설 수로 목표 대기인원을 충족할 수 없습니다.");
		}

		if (initialQueue.compareTo(targetQueue) <= 0) {
			return new Result(requiredTotal, predictedQueue, 0);
		}

		BigDecimal arrivalRatePerMin = forecastArrivals.divide(horizonMinutes, MATH_CONTEXT);
		BigDecimal netDrainPerMin = serviceRatePerFacilityPerMin
				.multiply(BigDecimal.valueOf(requiredTotal), MATH_CONTEXT)
				.subtract(arrivalRatePerMin);

		if (netDrainPerMin.signum() <= 0) {
			throw new IllegalStateException("추천 시설 수의 순 대기열 감소량이 0 이하입니다.");
		}

		int clearMinutes = initialQueue.subtract(targetQueue)
				.divide(netDrainPerMin, 0, RoundingMode.CEILING)
				.intValueExact();

		if (BigDecimal.valueOf(clearMinutes).compareTo(horizonMinutes) > 0) {
			throw new IllegalStateException("추천 시설 수로 목표 시간 안에 혼잡을 해소할 수 없습니다.");
		}

		return new Result(requiredTotal, predictedQueue, clearMinutes);
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

	public static final class Result {
		private final int requiredTotal;
		private final BigDecimal predictedQueue;
		private final int clearMinutes;

		private Result(int requiredTotal, BigDecimal predictedQueue, int clearMinutes) {
			this.requiredTotal = requiredTotal;
			this.predictedQueue = predictedQueue;
			this.clearMinutes = clearMinutes;
		}

		public int getRequiredTotal() {
			return requiredTotal;
		}

		public BigDecimal getPredictedQueue() {
			return predictedQueue;
		}

		public int getClearMinutes() {
			return clearMinutes;
		}
	}
}
