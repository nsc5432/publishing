package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DsbdFltIntrvlDto {
	private String bgnHhmm;
	private String endHhmm;
	private int fltCnt;
	private int psgCnt;
	private int yesterdayFltDiffCnt;
	private int yesterdayPsgDiffCnt;
}
