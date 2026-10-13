package aoms.pm.cast.service;

import aoms.pm.cast.dto.FcltQueueScenarioDto;
import aoms.pm.cast.dto.FcltQueueScenarioSearchDto;

/**
 * @Classname : CastFcltQueueScenarioService.java
 * @Description : 요약보기 시설 카드 혼잡해소 시나리오 팝업 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 13. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastFcltQueueScenarioService {
	FcltQueueScenarioDto retrieveFcltQueueScenario(FcltQueueScenarioSearchDto searchDto);
}
