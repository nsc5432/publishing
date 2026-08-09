package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 출국장 화면 본문 — 타임라인을 옮길 때마다 hhmm 만 바꿔 재호출한다 */
@Getter
@Setter
public class DepHallDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private String tmnlId; // T1 / T2
	private String hhmm; // 조회 조건 반향
	private MapNoticeDto notice; // 상단 혼잡 알림 (출국장만 담는다)
	private List<DepHallGateDto> gateList; // 출국장 카드 (T1 6곳 / T2 2곳)
	private List<MapMarkerDto> depMarkerList; // 출국장 마커
	private List<MapMarkerDto> chknMarkerList; // 아일랜드 마커 A~N
	private List<MapMarkerDto> gateMarkerList; // 출입구 게이트 마커 (T1 14곳 / T2 12곳)
}
