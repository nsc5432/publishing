package aoms.pm.cast.dto;

import aoms.pm.cast.enums.DowType;

import lombok.Getter;
import lombok.Setter;

/**
 * 상단 카드 — 요일 속성.
 * 공휴일 달력 테이블이 확인되지 않아 spclNote 는 아직 '' 로 내려간다.
 */
@Getter
@Setter
public class DowAttrDto {
	private String dowNm; // 표시 문구 (예: 주말 전일(금))
	private DowType dowType; // 요일 구분
	private String spclNote; // 특이점 (예: 공휴일 전일) — 원천 미확보, 항상 ''
}
