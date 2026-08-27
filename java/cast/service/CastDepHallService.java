package aoms.pm.cast.service;

import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;

/**
 * @Classname : CastDepHallService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 출국장 Service
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
public interface CastDepHallService {
	DepHallDto retrieveDepHall(DepHallSearchDto searchDto);
}
