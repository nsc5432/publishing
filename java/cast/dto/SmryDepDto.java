package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmryDepDto {
	private String time;
	private String depNum;
	private CongestionStatus cgnStatus;
	private boolean isOper; // 운영여부
	private int wtngPsgCnt;
	private int prcsHr;
	private int wtngHr;
}
