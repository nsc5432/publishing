package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 화면 본문 — <b>하루치</b>를 한 번에 내려준다.
 *
 * 맵 · 표 보기는 slotList 에서 한 칸을 읽고, 차트 보기는 슬롯 전체를 훑어 추이를 그린다.
 * 세 보기가 같은 한 건을 나눠 쓰므로 타임라인 · 보기 전환은 재조회를 부르지 않는다.
 */
@Getter
@Setter
public class DepHallDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private List<DepHallGateDto> gateList; // 출국장 카드 (T1 6곳 / T2 2곳)
	private List<MapMarkerDto> dptgtMarkerList; // 출국장 마커
	private List<MapMarkerDto> chknMarkerList; // 아일랜드 마커 A~N
	private List<MapMarkerDto> gateMarkerList; // 출입구 게이트 마커 (T1 14곳 / T2 12곳)
	private List<DepHallSlotDto> slotList; // 04:00~24:00 (30분, 41칸)
}
