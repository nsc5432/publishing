package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/** 사용자 시뮬레이션 진입 정보 조회 조건 */
@Getter
@Setter
public class UserSmltInfoSearchDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String ymd; // 기준일자 yyyyMMdd
	private TerminalKind tmnlId; // T1 / T2
}
