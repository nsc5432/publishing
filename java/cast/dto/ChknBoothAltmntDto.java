package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknBoothAltmntDto {
	private String alnCd; // 배정 항공사 코드
	private int operBgngHour; // 운영 시작 시 (0~23)
	private int operEndHour; // 운영 종료 시 (1~24, 배타)

	public ChknBoothAltmntDto withAlnCd(String alnCd) {
		this.alnCd = alnCd;
		return this;
	}

	public ChknBoothAltmntDto withOperBgngHour(int operBgngHour) {
		this.operBgngHour = operBgngHour;
		return this;
	}

	public ChknBoothAltmntDto withOperEndHour(int operEndHour) {
		this.operEndHour = operEndHour;
		return this;
	}
}
