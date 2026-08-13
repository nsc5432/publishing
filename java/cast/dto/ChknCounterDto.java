package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 체크인카운터 화면 본문 — <b>하루치</b>를 한 번에 내려준다.
 *
 * 차트 보기는 rsrcList(24시간)를 훑고, 표 보기는 타임라인이 가리키는 슬롯 한 칸을 읽는다.
 * 출국장 화면과 같은 규칙이라 타임라인 · 보기 전환은 재조회를 부르지 않는다.
 */
@Getter
@Setter
public class ChknCounterDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private int totCnt; // 전체 카운터 (개)
	private int oprIslandCnt; // 운영 아일랜드 (개)
	private int peakCounterCnt; // 피크 카운터 (시간대별 운영 카운터의 최댓값)
	private int totKioskCnt; // 키오스크 합계 (대)
	private int totBagDropCnt; // 셀프백드롭 합계 (대)
	private int waitMaxCnt; // 꺾은선 우측 축 최댓값 (명)
	private List<ChknCounterIslandDto> islandList; // 아일랜드 (A~N)
	private List<ChknCounterRsrcDto> rsrcList; // 시간대별 자원 (24개)
	private List<ChknCounterSlotDto> slotList; // 00:00~24:00 (30분, 49칸)
	private SmltKpiDto kpi;
}
