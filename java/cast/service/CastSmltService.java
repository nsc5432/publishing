package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserSmltExecDto;
import aoms.pm.cast.dto.UserSmltExecSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;

/**
 * @Classname : CastSmltService.java
 * @Description : Cast 시뮬레이션 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * 2026. 08. 08. / 노세찬 / executeUserSmlt 추가
 * 2026. 08. 08. / 노세찬 / 구 요약보기·맵형태보기 화면 전용 조회 5종 삭제.
 *                          리뉴얼 대시보드/맵은 retrieveDailySmlt* · retrieveSmltMap* 로
 *                          새로 정의됐고(API_SPEC.md 2장) 응답 형태가 다르다
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastSmltService {
	SmltStngDto retrieveSmltStngByKey(String smltId);

	List<WaitPsgDto> retrieveWaitPsgList(String smltId, String tmnlId, List<String> upPsgFcltCdList);

	SmltKpiDto retrieveSmltKpi(String smltId, String tmnlId, List<String> upPsgFcltCdList);

	UserSmltExecDto executeUserSmlt(UserSmltExecSearchDto searchDto);
}
