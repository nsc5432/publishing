package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
import aoms.pm.cast.dto.DsbdRsltDto;
import aoms.pm.cast.dto.DsbdSearchDto;
import aoms.pm.cast.dto.TmnlSmryDto;

/**
 * @Classname : CastSmryService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 요약보기(대시보드) Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * 2026. 11. 15. / 노세찬 / CastDsbdService 에서 이름 변경
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastSmryService {
	DsbdBaseInfoDto retrieveDailySmltBaseInfo(DsbdSearchDto searchDto);

	DsbdBaseInfoDto retrieveUserSmltBaseInfo(DsbdSearchDto searchDto);

	DsbdHeaderDto retrieveDailySmltHeader(DsbdSearchDto searchDto);

	TmnlSmryDto retrieveDailySmltTmnlSmry(DsbdSearchDto searchDto);

	List<DsbdRsltDto> retrieveDailySmltTmnlRsltByTime(DsbdSearchDto searchDto);

	List<DsbdFcltCardDto> retrieveDailySmltFcltCard(DsbdSearchDto searchDto);
}
