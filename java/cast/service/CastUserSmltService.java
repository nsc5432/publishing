package aoms.pm.cast.service;

import aoms.pm.cast.dto.UserSmltExecDto;
import aoms.pm.cast.dto.UserSmltExecSearchDto;
import aoms.pm.cast.dto.UserSmltFcltMapDto;
import aoms.pm.cast.dto.UserSmltFcltMapSearchDto;
import aoms.pm.cast.dto.UserSmltInfoDto;
import aoms.pm.cast.dto.UserSmltInfoSearchDto;

/**
 * @Classname : CastUserSmltService.java
 * @Description : 사용자 시뮬레이션 진입 · 지도 보기 · 수행 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastUserSmltService {
	UserSmltInfoDto retrieveUserSmltInfo(UserSmltInfoSearchDto searchDto);

	UserSmltFcltMapDto retrieveFcltMap(UserSmltFcltMapSearchDto searchDto);

	UserSmltExecDto executeUserSmlt(UserSmltExecSearchDto searchDto);
}
