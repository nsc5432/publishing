package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 맵형태보기 본문
 */
@Getter
@Setter
public class SmltMapDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private MapSmryDto summary; // 헤더 요약
	private List<MapOperCardDto> operCardList; // 운영시간 카드
	private List<MapMarkerDto> dptgtMarkerList; // 출국장 마커
	private List<MapMarkerDto> chknMarkerList; // 아일랜드 마커 A~N
	private List<MapMarkerDto> gateMarkerList; // 출입구 게이트 마커
	private List<MapChknInfoDto> chknInfoList; // 아일랜드 상세 정보
	private List<SmltMapSlotDto> slotList; // 00:00~24:00 (30분, 49칸)
}
