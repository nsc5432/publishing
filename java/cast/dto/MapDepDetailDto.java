package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/** 출국장 마커 클릭 — 미니 팝업 */
@Getter
@Setter
public class MapDepDetailDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String depNum; // 출국장 번호
	private String depNm; // 표시명 (예: 출국장 3)
	private CongestionStatus cgnStatus; // 상태 뱃지
	private MapCgnStatDto stat; // 혼잡 현황 지표 4종
}
