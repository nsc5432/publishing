package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WaitPsgDto {
	private int hour; // 시간대 (0~23)
	private int waitPsgCnt; // 대기인원 (명)

	public WaitPsgDto withHour(int hour) {
		this.hour = hour;
		return this;
	}

	public WaitPsgDto withWaitPsgCnt(int waitPsgCnt) {
		this.waitPsgCnt = waitPsgCnt;
		return this;
	}
}
