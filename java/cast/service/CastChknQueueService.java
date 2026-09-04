package aoms.pm.cast.service;

import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : CastChknQueueService.java
 * @Description : 체크인 아일랜드 공용 Queue Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 04. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastChknQueueService {
	ChknQueueDay retrieveChknQueueDay(String smltId, TerminalKind tmnlId, String excnYmd);
}
