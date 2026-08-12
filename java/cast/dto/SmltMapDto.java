package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 맵형태보기 본문 — <b>하루치</b>를 한 번에 내려준다.
 *
 * 화면은 타임라인을 옮길 때 slotList 에서 자리만 바꿔 읽는다 (재조회하지 않는다).
 * 마커 자리 · 운영시간 카드 · 헤더 요약처럼 시각과 무관한 값은 슬롯 밖에 한 벌만 둔다.
 */
@Getter
@Setter
public class SmltMapDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private MapSmryDto summary; // 헤더 우측 운항/여객
	private List<MapOperCardDto> operCardList; // 운영시간 도넛 카드
	private List<MapMarkerDto> depMarkerList; // 출국장 마커 (T1 6곳 / T2 2곳)
	private List<MapMarkerDto> chknMarkerList; // 아일랜드 마커 A~N
	private List<MapMarkerDto> gateMarkerList; // 출입구 게이트 마커 1~14
	private List<MapChknInfoDto> chknInfoList; // 아일랜드 상세 팝업 고정 정보
	private List<SmltMapSlotDto> slotList; // 00:00~24:00 (30분, 49칸)
}
