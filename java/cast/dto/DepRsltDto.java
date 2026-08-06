package aoms.pm.cast.dto;

import aoms.pm.cast.domains.AggData;
import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepRsltDto extends AggData {
	private String depNum;
	private CongestionStatus cgnStatus;
	
	public DepRsltDto withDepNum(String depNum) {
		this.depNum = depNum;
		return this;
	}
	
	public DepRsltDto withCgnStatus(CongestionStatus cgnStatus) {
		this.cgnStatus = cgnStatus;
		return this;
	}
}
