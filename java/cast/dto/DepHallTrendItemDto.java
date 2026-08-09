package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 추이 1구간 (30분).
 * 시간 단위는 <b>초</b> 다 (맵형태보기 지표와 같다).
 */
@Getter
@Setter
public class DepHallTrendItemDto {
	private String hhmm; // 구간 시각 HHmm
	private int wtngPsgCnt; // 대기인원 (명)
	private int wtngHr; // 대기시간 (초)
	private int prcsPsgCnt; // 처리인원 (명)
	private int prcsHr; // 처리시간 (초)

	public DepHallTrendItemDto withHhmm(String hhmm) {
		this.hhmm = hhmm;
		return this;
	}
}
