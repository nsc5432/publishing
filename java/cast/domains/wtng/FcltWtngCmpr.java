package aoms.pm.cast.domains.wtng;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Classname : FcltWtngCmpr.java
 * @Description : 같은 구간 전 시설의 비교 기준 — 대기인원은 합계, 나머지는 운영 시설 평균
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
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public final class FcltWtngCmpr {
	/** 평균에 넣은 시설 수 (운영 부스 0 이고 처리 0 인 시설 제외) */
	private final int unitCnt;
	/** 전 시설 구간 마지막 Queue 합 */
	private final int totWtngPsgCnt;
	private final Double avgPrcsPsgCnt;
	/** 처리인원 가중평균 대기시간 (초) */
	private final Double avgWtngSec;
	/** 처리시간이 있는 처리인원 가중평균 처리시간 (초) */
	private final Double avgPrcsSec;
}
