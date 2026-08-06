package aoms.pm.cast.dto;

import aoms.pm.cast.domains.AggData;
import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknRsltDto extends AggData {
	private String ymd;
	private String tmnlId;
	private String alnCd;
	private String fcltCd;
	private String island;
	private int counterNum;
	private CongestionStatus cgnStatus;
	
	public ChknRsltDto withAlnCd(String alnCd) {
		this.alnCd = alnCd;
		return this;
	}
	
	public ChknRsltDto withCounterNum(int counterNum) {
		this.counterNum = counterNum;
		return this;
	}
	
	public ChknRsltDto withCgnStatus(CongestionStatus cgnStatus) {
		this.cgnStatus = cgnStatus;
		return this;
	}
}
