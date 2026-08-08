package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.ChknRsltDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.UserSmltChknSaveDto;
                                                                                                             
/**  												                                                           
 * @Classname   : CastChknMapper.java                                                              
 * @Description :  체크인카운터 정보 관리 Mapper                                                       
 *                                                                                                      	   
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.                                                                            	   
 * <pre>                                                                    		                           
 *------------------------------------------------------------------------------                             
 * Modification Information                                                                 			       
 *------------------------------------------------------------------------------                             
 * 수정일 / 수정자 /수정내용                    													           
 * ----------  ------  ---------------------------------------------------------                             
 * 2026. 03. 12 / 노세찬 / 최초작성
 * 2026. 08. 08 / 노세찬 / 사용자 시뮬레이션 체크인 저장 statement 추가
 *------------------------------------------------------------------------------
 *                                                                   		                                    
 * </pre>                                                                    		                            
 */                                                                   		                                
@Mapper                                                                                                     	
public interface CastChknMapper {
	List<ChknRsltDto> retrieveSmltChknList(
		@Param("smltId") String smltId, @Param("ymd") String ymd,
		@Param("tmnlId") String tmnlId, @Param("island") String island
	);

	List<CknctCntRawDto> retrieveCknctCntList(
		@Param("tmnlId") String tmnlId, @Param("useCrgTypeCdList") List<String> useCrgTypeCdList
	);

	List<String> retrieveAlnCdList(@Param("tmnlId") String tmnlId);

	// 저장 — 전체 교체(delete-then-insert). 삭제 범위는 SMLT_ID + TMNL_ID 로 한정한다
	void deleteUserChknIslandList(UserSmltChknSaveDto saveDto);

	void deleteUserChknOperHrList(UserSmltChknSaveDto saveDto);

	void deleteUserChknBoothList(UserSmltChknSaveDto saveDto);

	void insertUserChknIslandList(UserSmltChknSaveDto saveDto);

	void insertUserChknOperHrList(UserSmltChknSaveDto saveDto);

	void insertUserChknBoothList(UserSmltChknSaveDto saveDto);
}                                                                                                            
