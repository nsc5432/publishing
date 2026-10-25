package aoms.pm.cast.domains.wtng;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;

/**
 * @Classname : FcltWtngSec.java
 * @Description : 시설 1곳의 10분 구간 [secBgngDt, secBgngDt+10분) 대기 기본 통계 — TN_PM_SMLT_FCLT_WTNG_RSLT 1행
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Getter
@Builder
public final class FcltWtngSec {
	private final String unitCd;
	private final LocalDateTime secBgngDt;
	/** null 은 미확인, 0 은 확인된 빈 대기열 */
	private final Integer endWtngPsgCnt;
	private final int prcsPsgCnt;
	private final double wtngPsecSum;
	private final int wtngVldPsgCnt;
	private final double prcsPsecSum;
	private final int prcsVldPsgCnt;
	private final long wtngPsgCntSum;
	private final int wtngNocs;
	private final Integer maxWtngPsgCnt;
	private final Integer endOperCntom;
	private final Long prcsCpct;
	private final Long prcsVldOperCntomSum;
	private final boolean obsrvn;
}
