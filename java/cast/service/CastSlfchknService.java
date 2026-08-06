package aoms.pm.cast.service;

import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.SlfchknRsltDto;

/**
 * @Classname : CastSlfchknService.java
 * @Description : Cast 셀프체크인 Service
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
public interface CastSlfchknService {
	Map<String, List<SlfchknRsltDto>> retrieveSlfchknGroupByTime(String smltId, String tmnlId);

	Map<String, List<SlfchknRsltDto>> retrieveSlfchknGroupByTimeUsingDate(String ymd, String tmnlId);
}
