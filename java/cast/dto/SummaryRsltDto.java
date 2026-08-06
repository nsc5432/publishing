package aoms.pm.cast.dto;

import aoms.pm.cast.domains.AggData;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SummaryRsltDto extends AggData {
	private String psgFcltCd; // 시설코드
}
