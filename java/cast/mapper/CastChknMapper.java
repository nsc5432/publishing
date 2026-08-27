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
	List<CknctCntRawDto> retrieveCknctCntList(@Param("tmnlId") String tmnlId, @Param("useCrgTypeCdList") List<String> useCrgTypeCdList);

	List<String> retrieveAlnCdList(@Param("ymd") String ymd, @Param("tmnlId") String tmnlId);

	List<ChknIslandDto> retrieveUserChknIslandList(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	List<UserChknOperHrRawDto> retrieveUserChknOperHrList(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	List<UserChknBoothRawDto> retrieveUserChknBoothList(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	void deleteUserChknIslandList(UserSmltChknSaveDto saveDto);

	void deleteUserChknOperHrList(UserSmltChknSaveDto saveDto);

	void deleteUserChknBoothList(UserSmltChknSaveDto saveDto);

	void insertUserChknIslandList(UserSmltChknSaveDto saveDto);

	void insertUserChknOperHrList(UserSmltChknSaveDto saveDto);

	void insertUserChknBoothList(UserSmltChknSaveDto saveDto);
}                                                                                                            
