package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.UserChknBoothRawDto;
import aoms.pm.cast.dto.UserChknOperHrRawDto;
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
 *------------------------------------------------------------------------------
 *                                                                   		                                    
 * </pre>                                                                    		                            
 */                                                                   		                                
@Mapper                                                                                                     	
public interface CastChknMapper {
	List<CknctCntRawDto> retrieveCknctCntList(
		@Param("tmnlId") String tmnlId, @Param("useCrgTypeCdList") List<String> useCrgTypeCdList
	);

	// 그날 그 터미널에 배정된 항공사 — 도크 팝오버의 선택지다
	List<String> retrieveAlnCdList(@Param("ymd") String ymd, @Param("tmnlId") String tmnlId);

	// 사용자 저장분 재조회 — 있으면 기준 데이터(배정정보) 대신 이쪽이 화면 초기값이 된다
	List<ChknIslandDto> retrieveUserChknIslandList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	List<UserChknOperHrRawDto> retrieveUserChknOperHrList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	List<UserChknBoothRawDto> retrieveUserChknBoothList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	// 저장 — 전체 교체(delete-then-insert). 삭제 범위는 SMLT_ID + TMNL_ID 로 한정한다
	void deleteUserChknIslandList(UserSmltChknSaveDto saveDto);

	void deleteUserChknOperHrList(UserSmltChknSaveDto saveDto);

	void deleteUserChknBoothList(UserSmltChknSaveDto saveDto);

	void insertUserChknIslandList(UserSmltChknSaveDto saveDto);

	void insertUserChknOperHrList(UserSmltChknSaveDto saveDto);

	void insertUserChknBoothList(UserSmltChknSaveDto saveDto);
}                                                                                                            
