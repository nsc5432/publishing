package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/** 시설물 매핑 조회 조건 */
@Getter
@Setter
public class FcltMapSearchDto {
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
}
