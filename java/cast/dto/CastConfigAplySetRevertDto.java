package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigAplySetRevertDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private long aplySetSn;
}
