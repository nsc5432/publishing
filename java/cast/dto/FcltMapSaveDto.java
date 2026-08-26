package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 시설물 매핑 저장 요청
 */
@Getter
@Setter
public class FcltMapSaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId; // T1 / T2
	private String fcltTmnlId; // DB 터미널 코드 (P01/P03)
	private List<FcltMapSaveItemDto> itemList;
}
