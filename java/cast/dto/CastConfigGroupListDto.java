package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigGroupListDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId;
	private List<CastConfigGroupDto> groupList = new ArrayList<>();
}
