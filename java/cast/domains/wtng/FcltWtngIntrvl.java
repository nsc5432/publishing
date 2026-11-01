package aoms.pm.cast.domains.wtng;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Classname : FcltWtngIntrvl.java
 * @Description : 시설유형 전체(체크인 아일랜드 전체 / 출국장 전체)의 [bgnDt, endDt) 구간 대기 집계 — 요약보기 요약정보
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 11. 01. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Getter
@AllArgsConstructor
public final class FcltWtngIntrvl {
	/** 구간 시작 시각의 대기인원 합 */
	private final Integer wtngPsgCnt;
	private final Integer arvlPsgCnt;
	private final Integer prcsPsgCnt;
	/** 구간 처리 여객의 처리인원 가중평균 대기시간 (초) */
	private final Double avgWtngSec;
}
