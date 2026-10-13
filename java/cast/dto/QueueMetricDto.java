package aoms.pm.cast.dto;

import aoms.pm.cast.domains.queue.CalculationMethod;
import aoms.pm.cast.domains.queue.MetricResult;
import aoms.pm.cast.domains.queue.MetricStatus;

import lombok.Getter;
import lombok.Setter;

/** 산출 지표 하나의 상태 · 근거 · 사유 (MetricResult 의 값 외 부분) */
@Getter
@Setter
public class QueueMetricDto {
	private MetricStatus status; // CALCULATED / ESTIMATED / UNAVAILABLE / UNREACHABLE
	private CalculationMethod method;
	private String reason;

	public static QueueMetricDto of(MetricResult<?> metric) {
		QueueMetricDto result = new QueueMetricDto();
		result.setStatus(metric.getStatus());
		result.setMethod(metric.getMethod());
		result.setReason(metric.getReason());

		return result;
	}
}
