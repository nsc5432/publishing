package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknBoothDto {
	private int boothNo; // 아일랜드 안의 부스 번호 (1부터)
	private List<ChknBoothAltmntDto> altmntList; // 시간 구간별 항공사 배정 (겹치지 않음, 시작 순)

	public ChknBoothDto withBoothNo(int boothNo) {
		this.boothNo = boothNo;
		return this;
	}

	public ChknBoothDto withAltmntList(List<ChknBoothAltmntDto> altmntList) {
		this.altmntList = altmntList;
		return this;
	}
}
