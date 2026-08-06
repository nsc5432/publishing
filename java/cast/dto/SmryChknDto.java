package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmryChknDto {
	private String time;
	private String island;
	private CongestionStatus cgnStatus;
	private int totalCnt;
	private int operCnt;
	private int wtngPsgCnt;
	private int prcsHr;
	private int wtngHr;
}
