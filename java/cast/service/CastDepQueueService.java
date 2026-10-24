package aoms.pm.cast.service;

import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.domains.dsbd.DepQueueWindow;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : CastDepQueueService.java
 * @Description : 출국장 보안검색 Queue 원천 Service — 요약보기 카드 / 혼잡해소 팝업 공용
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 17. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastDepQueueService {
	/** 평가시각 hhmm 의 관측구간 [hhmm-30분, hhmm) */
	DepQueueWindow retrieveDepQueueWindow(SmltStngDto smltStng, TerminalKind tmnlId, String hhmm);

	/** 슬롯마다 평가시각을 바꿔 읽는 화면(맵형태보기 / 출국장)용 하루치 원천 */
	DepQueueDay retrieveDepQueueDay(SmltStngDto smltStng, TerminalKind tmnlId);
}
