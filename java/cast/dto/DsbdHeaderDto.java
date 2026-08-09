package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 대시보드 상단 카드 4종 묶음 */
@Getter
@Setter
public class DsbdHeaderDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String ymd; // 기준일자 yyyyMMdd
	private FltPlanDto fltPlan; // 일일 운항계획
	private List<HourlyPsgDto> hourlyPsgList; // 시간대별 출발여객 (T1 / T2)
	private DowAttrDto dowAttr; // 요일 속성
	private WeatherDto weather; // 기상정보
}
