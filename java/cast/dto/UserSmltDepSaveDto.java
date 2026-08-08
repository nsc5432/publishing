package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltDepSaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
	private String fcltTmnlId; // TerminalKind 가 변환한 DB 터미널 코드 (P01/P03). 서비스가 채운다
	private List<DepGateDto> depList; // 터미널 1개분 전체. 구 saveScPlanInfo 의 planList 를 흡수했다
}
