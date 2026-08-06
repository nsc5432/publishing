package aoms.pm.cast.dto;

import aoms.pm.cast.domains.AggData;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.SlfType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SlfchknRsltDto extends AggData {
	private String island;
	private SlfType type;
	private CongestionStatus cgnStatus;
	
	public SlfchknRsltDto withIsland(String island) {
		this.island = island;
		return this;
	}
	
	public SlfchknRsltDto withType(SlfType type) {
		this.type = type;
		return this;
	}
	
	public SlfchknRsltDto withCgnStatus(CongestionStatus cgnStatus) {
		this.cgnStatus = cgnStatus;
		return this;
	}
}
