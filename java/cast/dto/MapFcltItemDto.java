package aoms.pm.cast.dto;

import aoms.pm.cast.enums.FcltType;

import lombok.Getter;
import lombok.Setter;

/** 아일랜드 상세 팝업의 시설 목록 1행 */
@Getter
@Setter
public class MapFcltItemDto {
	private FcltType fcltType; // 시설 구분 (아이콘)
	private String fcltNm; // 시설명
	private Integer prcsRate; // 처리율 (%) — 상업시설은 null

	public MapFcltItemDto withFcltType(FcltType fcltType) {
		this.fcltType = fcltType;
		return this;
	}

	public MapFcltItemDto withFcltNm(String fcltNm) {
		this.fcltNm = fcltNm;
		return this;
	}

	public MapFcltItemDto withPrcsRate(Integer prcsRate) {
		this.prcsRate = prcsRate;
		return this;
	}
}
