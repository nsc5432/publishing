package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 체크인카운터 화면 조회 조건
 */
@Getter
@Setter
public class ChknCounterSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2
}
