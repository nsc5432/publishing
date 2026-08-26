package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 체크인카운터 화면 본문
 */
@Getter
@Setter
public class ChknCounterDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private int totCnt; // 전체 카운터 (개)
	private int oprIslandCnt; // 운영 아일랜드 (개)
	private int peakCounterCnt; // 피크 카운터
	private int totKioskCnt; // 키오스크 합계 (대)
	private int totBagDropCnt; // 셀프백드롭 합계 (대)
	private int waitMaxCnt; // 대기인원 축 최댓값 (명)
	private List<ChknCounterIslandDto> islandList; // 아일랜드 목록
	private List<ChknCounterRsrcDto> rsrcList; // 시간대별 자원 (24개)
	private List<ChknCounterSlotDto> slotList; // 00:00~24:00 (30분, 49칸)
	private SmltKpiDto kpi;
}
