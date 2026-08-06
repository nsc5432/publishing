package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmryScDto {
	private String time;
	private String scNum;
	private CongestionStatus cgnStatus;
	private int wtngPsgCnt;
	private int prcsHr;
	private int wtngHr;
}
