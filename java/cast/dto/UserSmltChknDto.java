package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltChknDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private int totCnt; // 전체 카운터 수
	private int peakCounterCnt; // 피크 카운터 — 시간대별 운영 부스 합의 최댓값
	private int totKioskCnt; // 터미널 키오스크 합계
	private int totBagDropCnt; // 터미널 셀프백드랍 합계
	private int waitMaxCnt; // 대기인원 꺾은선 우측 축 최댓값
	private List<String> islandCdList; // 신규 아일랜드에 쓸 수 있는 아일랜드 문자
	private List<String> alnCdList; // 부스에 배정 가능한 항공사 코드
	private List<ChknIslandDto> islandList; // 아일랜드별 운영 정보
	private List<WaitPsgDto> waitList; // 시간대별 대기인원 (24개)
	private SmltKpiDto kpi; // 패널 헤드 결과 지표 4종
}
