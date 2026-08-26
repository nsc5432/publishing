package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltChknSaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private TerminalKind tmnlId; // T1 / T2
	private String fcltTmnlId; // DB 터미널 코드 (P01/P03)
	private List<ChknIslandDto> islandList; // 아일랜드 목록
}
