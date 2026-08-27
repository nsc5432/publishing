package aoms.pm.cast.service;

import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.DepOperHrRawDto;

/**
 * @Classname : CastOperHrService.java
 * @Description : Cast 실운영 운영시간 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 20. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastOperHrService {
	Map<String, List<DepOperHrRawDto>> retrieveDepOperHrMap(String fcltTmnlId, String ymd);
}
