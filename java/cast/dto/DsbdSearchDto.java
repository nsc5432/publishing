package aoms.pm.cast.dto;

import aoms.pm.cast.enums.DsbdCategory;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 요약보기(대시보드) 5개 API 의 공용 조회 조건.
 * 화면이 상단 바 하나로 조건을 잡고 5개 API 에 같은 값을 나눠 주므로 검색 DTO 도 하나로 둔다.
 */
@Getter
@Setter
public class DsbdSearchDto {
	private String ymd; // 기준일자 yyyyMMdd
	private String hhmm; // 기준시각 HHmm
	private String smltId;
	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
	private DsbdCategory category; // 시간대별 결과의 퀵 액세스 타일
	private FcltType fcltType; // 게이트 카드 구분 (CHKN / DEP)
	private Integer itvlMin; // 터미널 요약의 구간 집계 길이(분) — 안 보내면 서버 기본값
}
