package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 화면 본문
 */
@Getter
@Setter
public class DepHallDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private List<DepHallGateDto> gateList; // 출국장 카드
	private List<MapMarkerDto> dptgtMarkerList; // 출국장 마커
	private List<MapMarkerDto> chknMarkerList; // 아일랜드 마커 A~N
	private List<MapMarkerDto> gateMarkerList; // 출입구 게이트 마커
	private List<DepHallSlotDto> slotList; // 04:00~24:00 (30분, 41칸)
}
