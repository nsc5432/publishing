package aoms.pm.cast.service;

import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.UserSmltDepDto;
import aoms.pm.cast.dto.UserSmltDepSaveDto;
import aoms.pm.cast.dto.UserSmltDepSearchDto;

/**
 * @Classname : CastDepService.java
 * @Description : Cast 출국장 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
public interface CastDepService {
	UserSmltDepDto retrieveDepInfo(UserSmltDepSearchDto searchDto);

	JsonResponse saveDepInfo(UserSmltDepSaveDto saveDto);
}
