package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 시간대별 출발여객 막대 1개 */
@Getter
@Setter
public class HourlyPsgItemDto {
	private String time; // HH
	private int psgCnt; // 출발 여객수 (막대)
	private int fcstPsgCnt; // 예측 여객수 (라인)

	public HourlyPsgItemDto withTime(String time) {
		this.time = time;
		return this;
	}

	public HourlyPsgItemDto withPsgCnt(int psgCnt) {
		this.psgCnt = psgCnt;
		return this;
	}

	public HourlyPsgItemDto withFcstPsgCnt(int fcstPsgCnt) {
		this.fcstPsgCnt = fcstPsgCnt;
		return this;
	}
}
