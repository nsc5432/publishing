package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknBoothDto {
	private int boothNo; // 아일랜드 안의 부스 번호 (1부터)
	private String alnCd; // 배정 항공사 코드 — 미배정이면 ''
	private String customYn; // Custom 배정 여부

	public ChknBoothDto withBoothNo(int boothNo) {
		this.boothNo = boothNo;
		return this;
	}

	public ChknBoothDto withAlnCd(String alnCd) {
		this.alnCd = alnCd;
		return this;
	}

	public ChknBoothDto withCustomYn(String customYn) {
		this.customYn = customYn;
		return this;
	}
}
