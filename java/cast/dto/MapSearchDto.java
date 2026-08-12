package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 맵형태보기 조회 조건.
 * 하루치를 한 번에 내려주므로 타임라인 시각(hhmm)은 조건이 아니다.
 */
@Getter
@Setter
public class MapSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
}
