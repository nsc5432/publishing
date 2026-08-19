package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 시간대별 출발여객 막대 1개 */
@Getter
@Setter
public class HourlyPsgItemDto {
	private String time; // HH
	private int psgCnt; // 출발 여객수 — 실적 (라인)
	private int fcstPsgCnt; // 승객예고 인원수 — 예고 (막대)

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
