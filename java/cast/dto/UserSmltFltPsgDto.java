package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltFltPsgDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private int fltCnt;
	private int psgCnt;
	private String peakTime; // 요약: 피크 HHmm (운항편 수가 가장 많은 1시간의 시작, 같으면 이른 시각, 운항 0편이면 빈 값)
	private int ajmtRt; // 저장된 전체 비율 (%)
	private FltPsgChartDto fltChart;
	private FltPsgChartDto psgChart;
	private List<FltPsgHourDto> hourList; // 시간대별 목록 (24개)
}
