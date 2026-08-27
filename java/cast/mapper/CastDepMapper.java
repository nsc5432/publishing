package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.UserDepOperHrRawDto;
import aoms.pm.cast.dto.UserScPlanRawDto;
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
 *------------------------------------------------------------------------------
 *                                                                   		                                    
 * </pre>                                                                    		                            
 */                                                                   		                                
@Mapper                                                                                                     	
public interface CastDepMapper {
	List<DepFcltRawDto> retrieveDepFcltList(@Param("tmnlId") String tmnlId);

	List<ScCntRawDto> retrieveScCntList(
		@Param("tmnlId") String tmnlId, @Param("scRsrcId") String scRsrcId
	);

	List<DepGateDto> retrieveUserDepList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	List<UserDepOperHrRawDto> retrieveUserDepOperHrList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	List<UserScPlanRawDto> retrieveUserScPlanList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	void deleteUserDepList(UserSmltDepSaveDto saveDto);

	void deleteUserDepOperHrList(UserSmltDepSaveDto saveDto);

	void deleteUserScPlanList(UserSmltDepSaveDto saveDto);

	void insertUserDepList(UserSmltDepSaveDto saveDto);

	void insertUserDepOperHrList(UserSmltDepSaveDto saveDto);

	void insertUserScPlanList(UserSmltDepSaveDto saveDto);
}                                                                                                            
