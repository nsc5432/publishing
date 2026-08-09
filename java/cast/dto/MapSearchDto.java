package aoms.pm.cast.dto;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 맵형태보기 3개 API 의 공용 조회 조건.
 * hhmm 은 하단 타임라인 값이라 30분 단위(0000~2400)로 들어온다.
 */
@Getter
@Setter
public class MapSearchDto {
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
	private String hhmm; // 타임라인 기준 시각 HHmm
	private String island; // 아일랜드 상세 조회용 (A~N)
	private String depNum; // 출국장 상세 조회용 (1~6)
}
