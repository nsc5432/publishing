package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FltPsgChartItemDto {
	private String time; // 막대 라벨 HH (2시간 단위)
	private int cnt; // 막대 값

	public FltPsgChartItemDto withTime(String time) {
		this.time = time;
		return this;
	}

	public FltPsgChartItemDto withCnt(int cnt) {
		this.cnt = cnt;
		return this;
	}
}
