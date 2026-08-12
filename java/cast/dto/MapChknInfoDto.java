package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 상세 팝업에서 하루 내내 같은 부분 (시설 구성 · 매출).
 * 시각에 따라 움직이는 혼잡도 · 처리율은 {@link MapChknRsltDto} 가 갖는다.
 */
@Getter
@Setter
public class MapChknInfoDto {
	private String island; // 아일랜드 (예: M)
	private String fcltCd; // 시설 코드 (예: T1-3RD-M01-01)
	private List<MapFcltItemDto> fcltList; // 시설 목록
	private MapSalesDto sales; // 매출
}
