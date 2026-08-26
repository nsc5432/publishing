package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltFltPsgSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2
	private String ymd;
}
