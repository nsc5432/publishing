package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 상세 정보
 */
@Getter
@Setter
public class MapChknInfoDto {
	private String island; // 아일랜드
	private String fcltCd; // 시설 코드
	private List<MapFcltItemDto> fcltList; // 시설 목록
	private MapSalesDto sales; // 매출
}
