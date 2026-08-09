package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/** 아일랜드 마커 클릭 — 상세 팝업 */
@Getter
@Setter
public class MapChknDetailDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String island; // 아일랜드 (예: M)
	private String fcltCd; // 시설 코드 (예: T1-3RD-M01-01)
	private CongestionStatus cgnStatus; // 상태 뱃지
	private List<MapFcltItemDto> fcltList; // 시설 목록
	private MapCgnStatDto stat; // 혼잡 현황 지표 4종
	private MapSalesDto sales; // 매출
}
