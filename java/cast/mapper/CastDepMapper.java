package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.UserSmltDepSaveDto;
                                                                                                             
/**  												                                                           
 * @Classname   : CastDepMapper.java                                                              
 * @Description :  출국장 정보 관리 Mapper                                                       
 *                                                                                                      	   
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.                                                                            	   
 * <pre>                                                                    		                           
 *------------------------------------------------------------------------------                             
 * Modification Information                                                                 			       
 *------------------------------------------------------------------------------                             
 * 수정일 / 수정자 /수정내용                    													           
 * ----------  ------  ---------------------------------------------------------                             
 * 2026. 03. 12 / 노세찬 / 최초작성
 * 2026. 08. 08 / 노세찬 / 사용자 시뮬레이션 출국장·보안검색대 저장 statement 추가
 * 2026. 08. 08 / 노세찬 / 구 화면 전용 retrieveSmltDepList 삭제
 *------------------------------------------------------------------------------
 *                                                                   		                                    
 * </pre>                                                                    		                            
 */                                                                   		                                
@Mapper                                                                                                     	
public interface CastDepMapper {
	List<DepFcltRawDto> retrieveDepFcltList(@Param("tmnlId") String tmnlId);

	List<DepOperHrRawDto> retrieveDepOperHrList(
		@Param("tmnlId") String tmnlId, @Param("dgRsrcId") String dgRsrcId, @Param("ymd") String ymd
	);

	List<ScCntRawDto> retrieveScCntList(
		@Param("tmnlId") String tmnlId, @Param("scRsrcId") String scRsrcId
	);

	// 저장 — 전체 교체(delete-then-insert). 삭제 범위는 SMLT_ID + TMNL_ID 로 한정한다
	void deleteUserDepList(UserSmltDepSaveDto saveDto);

	void deleteUserDepOperHrList(UserSmltDepSaveDto saveDto);

	void deleteUserScPlanList(UserSmltDepSaveDto saveDto);

	void insertUserDepList(UserSmltDepSaveDto saveDto);

	void insertUserDepOperHrList(UserSmltDepSaveDto saveDto);

	void insertUserScPlanList(UserSmltDepSaveDto saveDto);
}                                                                                                            
