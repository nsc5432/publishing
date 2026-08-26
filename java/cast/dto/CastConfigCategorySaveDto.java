package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigCategorySaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId;
	private String fixAtrbGroupId;
	private String atrbGroupNm;
	private String frstRegDt;
	private List<String> sheetNmList = new ArrayList<>();
}
