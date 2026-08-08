package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltKpiRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
import aoms.pm.cast.dto.SummaryFlightDto;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.dto.WaitPsgDto;
                                                                                                             
/**  												                                                           
 * @Classname   : CastSmltMapper.java                                                              
 * @Description :  Cast 시뮬레이션 Mapper                                                       
 *                                                                                                      	   
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.                                                                            	   
 * <pre>                                                                    		                           
 *------------------------------------------------------------------------------                             
 * Modification Information                                                                 			       
 *------------------------------------------------------------------------------                             
 * 수정일 / 수정자 /수정내용                    													           
 * ----------  ------  ---------------------------------------------------------                             
 * 2026. 03. 12 / 노세찬 / 최초작성
 * 2026. 08. 08 / 노세찬 / 사용자 시뮬레이션 수행 이력 statement 추가
 *------------------------------------------------------------------------------
 *                                                                   		                                    
 * </pre>                                                                    		                            
 */                                                                   		                                
@Mapper                                                                                                     	
public interface CastSmltMapper {
	List<SmltStngDto> retrieveSmltStng(SmltStngSearchDto searchDto);

	SummaryFlightDto retrieveSummaryFlight(@Param("ymd") String ymd, @Param("tmnlId") String tmnlId);

	List<SummaryRsltDto> retrieveCastRsltDtl(
			@Param("smltId") String smltId, 
			@Param("dt") String dt, 
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList,
			@Param("psgFcltCdPrefix") String psgFcltCdPrefix
	);

	List<SummaryRsltDto> retrieveXovisRsltDtl(
			@Param("dt") String dt, 
			@Param("tmnlId") String tmnlId,
			@Param("island") String island,
			@Param("fcltTypeCdList") List<String> fcltTypeCdList
	);

	List<PsgPrcsGrd> retrievePrcsGrd(@Param("psgPrcsGrdCd") String psgPrcsGrdCd);

	List<WaitPsgDto> retrieveWaitPsgList(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	SmltKpiRawDto retrieveSmltKpiRaw(
			@Param("smltId") String smltId,
			@Param("tmnlId") String tmnlId,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList
	);

	// 수행 — 저장된 조건 존재 확인 · 이력 채번 · 이력 기록 · 이력 조회
	int retrieveUserSmltCondCnt(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	int retrieveNextSmltExcnSn(@Param("smltId") String smltId);

	void insertSmltExcnHstry(SmltExcnDto dto);

	SmltExcnDto retrieveSmltExcnByKey(@Param("smltId") String smltId, @Param("smltExcnSn") int smltExcnSn);

	List<SmltExcnDto> retrieveSmltExcnList(@Param("bgnDt") String bgnDt, @Param("endDt") String endDt);
}                                                                                                            
