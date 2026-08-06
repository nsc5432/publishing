package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OprTimeDto {
	private int bgnHour; // 운영 시작 (0~24)
	private int endHour; // 운영 종료 (0~24)

	public OprTimeDto withBgnHour(int bgnHour) {
		this.bgnHour = bgnHour;
		return this;
	}

	public OprTimeDto withEndHour(int endHour) {
		this.endHour = endHour;
		return this;
	}
}
