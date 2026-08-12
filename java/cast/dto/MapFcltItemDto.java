package aoms.pm.cast.dto;

import aoms.pm.cast.enums.FcltType;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 상세 팝업의 시설 목록 1행 — 시각과 무관한 구성이다.
 * 처리율 값 자체는 시각마다 달라 {@link MapChknRsltDto} 가 갖는다.
 */
@Getter
@Setter
public class MapFcltItemDto {
	private FcltType fcltType; // 시설 구분 (아이콘)
	private String fcltNm; // 시설명
	private String prcsRateYn; // N 이면 처리율을 쓰지 않는다 (상업시설)

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
