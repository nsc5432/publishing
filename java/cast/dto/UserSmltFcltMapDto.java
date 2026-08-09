package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.FcltType;

import lombok.Getter;
import lombok.Setter;

/** 요약 바의 지도 보기 — 시설 배치 마커 */
@Getter
@Setter
public class UserSmltFcltMapDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private FcltType fcltType; // 조회 조건 반향
	private String island; // 아일랜드 단위 시설이 아니면 ''
	private List<MapMarkerDto> markerList; // 도면 마커
}
