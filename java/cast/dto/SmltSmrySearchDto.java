package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltSmrySearchDto {
	private String ymd;
	private String smltId;
	private CongestionType congestionType;
}
