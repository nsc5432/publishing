package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 맵형태보기 조회 조건
 */
@Getter
@Setter
public class MapSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2
}
