package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OprTimeDto {
	private int operBgngHour; // 운영 시작 (0~24)
	private int operEndHour; // 운영 종료 (0~24)

	public OprTimeDto withOperBgngHour(int operBgngHour) {
		this.operBgngHour = operBgngHour;
		return this;
	}

	public OprTimeDto withOperEndHour(int operEndHour) {
		this.operEndHour = operEndHour;
		return this;
	}
}
