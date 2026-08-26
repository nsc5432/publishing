package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/** 게이트 카드 하단 칩 1개 (아일랜드 문자 또는 출국장 번호) */
@Getter
@Setter
public class FcltUnitDto {
	private String unitCd; // 칩 라벨 (A~N, 1~6)
	private CongestionStatus cgnStatus; // 칩 색상
	private String useYn; // 사용여부(회색)

	public FcltUnitDto withUnitCd(String unitCd) {
		this.unitCd = unitCd;
		return this;
	}

	public FcltUnitDto withCgnStatus(CongestionStatus cgnStatus) {
		this.cgnStatus = cgnStatus;
		return this;
	}

	public FcltUnitDto withUseYn(String useYn) {
		this.useYn = useYn;
		return this;
	}
}
