package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltExecSearchDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
	private String fcltTmnlId; // TerminalKind 가 변환한 DB 터미널 코드 (P01/P03). 서비스가 채운다
}
