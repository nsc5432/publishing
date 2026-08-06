package aoms.pm.cast.service;

import aoms.pm.cast.dto.UserSmltFltPsgDto;
import aoms.pm.cast.dto.UserSmltFltPsgSearchDto;

/**
 * @Classname : CastFltPsgService.java
 * @Description : Cast 운항편/여객수 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 07. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastFltPsgService {
	UserSmltFltPsgDto retrieveFltPsgInfo(UserSmltFltPsgSearchDto searchDto);
}
