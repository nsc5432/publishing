package aoms.pm.cast.dto;

import aoms.pm.cast.enums.FcltType;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 상세의 시설 목록 1행
 */
@Getter
@Setter
public class MapFcltItemDto {
	private FcltType fcltType; // 시설 구분
	private String fcltNm; // 시설명
	private String prcsRateYn; // 처리율 사용여부

	public MapFcltItemDto withFcltType(FcltType fcltType) {
		this.fcltType = fcltType;
		return this;
	}

	public MapFcltItemDto withFcltNm(String fcltNm) {
		this.fcltNm = fcltNm;
		return this;
	}

	public MapFcltItemDto withPrcsRateYn(String prcsRateYn) {
		this.prcsRateYn = prcsRateYn;
		return this;
	}
}
