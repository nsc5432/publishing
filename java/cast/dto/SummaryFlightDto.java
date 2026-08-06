package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SummaryFlightDto {
	private int t1FltCnt;
	private int t1PsgCnt;
	private int t1BeforeFltCnt;
	private int t1BeforePsgCnt;
	private int t2FltCnt;
	private int t2PsgCnt;
	private int t2BeforeFltCnt;
	private int t2BeforePsgCnt;
	
	private int fltCnt;
	private int psgCnt;
}
