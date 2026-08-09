package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 상단 카드 — 일일 운항계획 (공항 전체, 터미널 구분 없음) */
@Getter
@Setter
public class FltPlanDto {
	private int depFltCnt; // 출발 운항편
	private int arrFltCnt; // 도착 운항편
	private int totFltCnt; // 총 운항편
	private int depPsgCnt; // 출발 여객
	private int totPsgCnt; // 총 여객
}
