package aoms.pm.cast.service;

import aoms.pm.cast.dto.ChknCounterDto;
import aoms.pm.cast.dto.ChknCounterSearchDto;
import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.SmltMapDto;

/**
 * @Classname : CastSmryDtlService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 상세(맵형태보기 · 체크인카운터 · 출국장) Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성 (맵형태보기 · 출국장)
 * 2026. 08. 14. / 노세찬 / 최초작성 (체크인카운터)
 * 2026. 11. 15. / 노세찬 / CastMapService · CastChknCounterService · CastDepHallService 통합
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastSmryDtlService {
	SmltMapDto retrieveSmltMap(MapSearchDto searchDto);

	ChknCounterDto retrieveChknCounter(ChknCounterSearchDto searchDto);

	DepHallDto retrieveDepHall(DepHallSearchDto searchDto);
}
