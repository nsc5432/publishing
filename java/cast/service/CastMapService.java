package aoms.pm.cast.service;

import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.SmltMapDto;

/**
 * @Classname : CastMapService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 맵형태보기 Service
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
public interface CastMapService {
	SmltMapDto retrieveSmltMap(MapSearchDto searchDto);
}
