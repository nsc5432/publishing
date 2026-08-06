package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.AdjType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltFltPsgDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private int fltCnt; // 요약: 운항편
	private int psgCnt; // 요약: 여객
	private String peakTime; // 요약: 피크 HHmm
	private AdjType adjType; // 수정 방식 (저장 구조 미확보, 항상 RATIO)
	private int adjRate; // 전체 비율 (%) — 저장 구조 미확보, 항상 0
	private FltPsgChartDto fltChart; // 운항편 수 막대 차트
	private FltPsgChartDto psgChart; // 여객 수 막대 차트
	private List<FltPsgHourDto> hourList; // 시간대별 목록 (24개)
}
