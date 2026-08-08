package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.AdjType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltFltPsgSaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
	private String fcltTmnlId; // TerminalKind 가 변환한 DB 터미널 코드 (P01/P03). 서비스가 채운다
	private AdjType adjType; // 수정 방식 (RATIO 전체 비율 / HOURLY 시간대별)
	private String adjTypeCd; // adjType 의 문자열 값. 서비스가 채운다
	private int adjRate; // 전체 비율 (%) — adjType = RATIO 일 때 적용
	private List<FltPsgHourDto> hourList; // 시간대별 수정값 — adjType = HOURLY 일 때 적용
}
