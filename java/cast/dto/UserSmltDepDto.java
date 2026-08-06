package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltDepDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private int peakScCnt; // 피크 검색대 — 시간대별 검색대 합의 최댓값
	private int waitMaxCnt; // 대기인원 꺾은선 우측 축 최댓값
	private List<DepGateDto> depList; // 출국장별 운영 정보
	private List<WaitPsgDto> waitList; // 시간대별 대기인원 (24개)
	private SmltKpiDto kpi; // 패널 헤드 결과 지표 4종
}
