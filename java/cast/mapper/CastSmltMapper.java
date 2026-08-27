package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.SmltExcnCntRawDto;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltKpiRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
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
 *------------------------------------------------------------------------------
 *                                                                   		                                    
 * </pre>                                                                    		                            
 */                                                                   		                                
@Mapper                                                                                                     	
public interface CastSmltMapper {
	List<SmltStngDto> retrieveSmltStng(SmltStngSearchDto searchDto);

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

	// 운항·체크인·출국장 세 영역이 각각 저장돼 있는지 본다. 하나라도 비면 0
	int retrieveUserSmltCondFilledCnt(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	int retrieveNextSmltFlfmtSn(@Param("smltId") String smltId);

	void insertSmltFlfmtHstry(SmltExcnDto dto);

	int updateSmltFlfmtClosed(
			@Param("smltId") String smltId,
			@Param("smltFlfmtSn") int smltFlfmtSn,
			@Param("smltFlfmtSttsCd") String smltFlfmtSttsCd
	);

	SmltExcnDto retrieveSmltFlfmtByKey(@Param("smltId") String smltId, @Param("smltFlfmtSn") int smltFlfmtSn);

	List<SmltExcnDto> retrieveSmltFlfmtList(@Param("bgnDt") String bgnDt, @Param("endDt") String endDt);

	SmltExcnCntRawDto retrieveSmltFlfmtSmry(@Param("bgnDt") String bgnDt, @Param("endDt") String endDt);

	SmltExcnDto retrieveSmltFlfmtDetail(@Param("smltId") String smltId);

	String retrieveUserSmltSaveDt(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	SmltExcnDto retrieveLastSmltFlfmt(@Param("smltId") String smltId);
}                                                                                                            
