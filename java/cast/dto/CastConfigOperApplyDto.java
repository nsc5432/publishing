package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigOperApplyDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId;
	private String groupId;
	private String fixAtrbGroupId;
}
