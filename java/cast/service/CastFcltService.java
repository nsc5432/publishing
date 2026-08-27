package aoms.pm.cast.service;

import aoms.pm.cast.dto.FcltMapListDto;
import aoms.pm.cast.dto.FcltMapSaveDto;
import aoms.pm.cast.dto.FcltMapSearchDto;
import aoms.pm.cast.dto.JsonResponse;

/**
 * @Classname : CastFcltService.java
 * @Description : 시설물 매핑 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastFcltService {
	FcltMapListDto retrieveFcltMapList(FcltMapSearchDto searchDto);

	JsonResponse saveFcltMapList(FcltMapSaveDto saveDto);
}
