package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 체크인카운터 화면 조회 조건.
 * 하루치를 한 번에 내려주므로 타임라인 시각(hhmm)은 조건이 아니다 (출국장 화면과 같다).
 */
@Getter
@Setter
public class ChknCounterSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
}
