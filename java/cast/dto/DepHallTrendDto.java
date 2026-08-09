package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 차트 보기 — 출국장별 시간대별 추이.
 * 하루치를 한 번에 내려주므로 타임라인을 옮겨도 다시 부르지 않는다 (터미널이 바뀔 때만 재조회).
 */
@Getter
@Setter
public class DepHallTrendDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private List<String> timeList; // x 축 눈금 HHmm (30분 단위, 0400 ~ 2400)
	private List<DepHallTrendSeriesDto> seriesList;
}
