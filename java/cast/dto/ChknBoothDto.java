package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknBoothDto {
	private int boothNo; // 아일랜드 안의 부스 번호 (1부터)
	private String alnCd; // 배정 항공사 코드
	private String cstmAltmntYn; // Custom 배정 여부

	public ChknBoothDto withBoothNo(int boothNo) {
		this.boothNo = boothNo;
		return this;
	}

	public ChknBoothDto withAlnCd(String alnCd) {
		this.alnCd = alnCd;
		return this;
	}

	public ChknBoothDto withCstmAltmntYn(String cstmAltmntYn) {
		this.cstmAltmntYn = cstmAltmntYn;
		return this;
	}
}
