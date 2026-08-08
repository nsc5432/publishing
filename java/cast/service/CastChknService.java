package aoms.pm.cast.service;

import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.UserSmltChknDto;
import aoms.pm.cast.dto.UserSmltChknSaveDto;
import aoms.pm.cast.dto.UserSmltChknSearchDto;

/**
 * @Classname : CastChknService.java
 * @Description : Cast 체크인카운터 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * 2026. 08. 08. / 노세찬 / saveChknCounterInfo 추가
 * 2026. 08. 08. / 노세찬 / 구 화면 전용 시간대별 조회 3종 삭제 (리뉴얼 화면 미사용)
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
public interface CastChknService {
	UserSmltChknDto retrieveChknCounterInfo(UserSmltChknSearchDto searchDto);

	JsonResponse saveChknCounterInfo(UserSmltChknSaveDto saveDto);
}
