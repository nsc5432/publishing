package aoms.pm.cast.dto;

import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/** 사용자 시뮬레이션 지도 보기 조회 조건 */
@Getter
@Setter
public class UserSmltFcltMapSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2
	private FcltType fcltType; // 조회할 시설 구분
	private String island; // 아일랜드 단위 시설이 아니면 생략
}
