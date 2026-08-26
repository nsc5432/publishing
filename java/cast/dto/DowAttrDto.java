package aoms.pm.cast.dto;

import aoms.pm.cast.enums.DowType;

import lombok.Getter;
import lombok.Setter;

/**
 * 요일 속성
 */
@Getter
@Setter
public class DowAttrDto {
	private String dowNm; // 표시 문구
	private DowType dowType; // 요일 구분
	private String spclNote; // 특이점
}
