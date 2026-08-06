package aoms.pm.cast.service;

import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SmltSmryDepSearchDto;
import aoms.pm.cast.dto.SmltSmryDto;
import aoms.pm.cast.dto.SmltSmryMapSearchDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SummaryMapDto;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.CongestionType;
import aoms.pm.cast.enums.PrcsGrdType;

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
	String retrieveRecentSmltId(String ymd);
	
	SmltSmryDto retrieveDailySmltSmry(String smltId, CongestionType congestionType);

	List<SummaryRsltDto> retrieveDailySmltSmryDepChart(SmltSmryDepSearchDto searchDto);

	Map<String, SummaryMapDto> retrieveSmltSmryMap(SmltSmryMapSearchDto searchDto);
	
	SmltStngDto retrieveSmltStngByKey(String smltId);
	
	Map<CongestionStatus, PsgPrcsGrd> retrievePrcsGrdMap(PrcsGrdType prcsGrdType);
	
	List<SummaryRsltDto> getXovisDatas(String ymd, CongestionType congestionType, String tmnlId, String island, int interval);
}
