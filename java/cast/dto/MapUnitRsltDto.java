package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 묶음 단위(아일랜드 · 출국장) 1곳의 한 시각 상태
 */
@Getter
@Setter
public class MapUnitRsltDto {
	private String unitCd; // 아일랜드 문자 또는 출국장 번호
	private CongestionStatus cgnStatus; // 혼잡도
	private MapCgnStatDto stat; // 혼잡 현황 지표 4종
}
