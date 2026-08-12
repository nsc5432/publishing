package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 아일랜드는 상세 팝업에 처리율이 더 붙는다 */
@Getter
@Setter
public class MapChknRsltDto extends MapUnitRsltDto {
	private int prcsRate; // 처리율 (%)
}
