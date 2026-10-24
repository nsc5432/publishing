package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltStngDto;
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
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastSmltService {
	SmltStngDto retrieveSmltStngByKey(String smltId);

	SmltStngDto retrieveSmltStngByModel(String smltId, int smltMdlSn);

	/** 실행의 모델이 하나일 때만 그 설정을 돌려준다. 여럿이면 임의로 고르지 않고 실패한다 */
	SmltStngDto retrieveUniqueSmltStng(String smltId);

	List<WaitPsgDto> retrieveWaitPsgList(String smltId, String tmnlId, List<String> upPsgFcltCdList);

	SmltKpiDto retrieveSmltKpi(String smltId, String tmnlId, List<String> upPsgFcltCdList);
}
