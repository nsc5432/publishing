package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserSmltCustomCondDto {
	private TerminalKind tmnlId;
	private UserSmltFltPsgDto flt;
	private UserSmltChknDto chkn;
	private UserSmltDepDto dep;
}
