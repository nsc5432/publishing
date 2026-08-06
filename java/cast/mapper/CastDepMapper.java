package aoms.pm.cast.mapper;                                                                   	       
                                                                                                             
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.DepRsltDto;
import aoms.pm.cast.dto.ScCntRawDto;
                                                                                                             
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
	List<DepRsltDto> retrieveSmltDepList(
		@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	List<DepFcltRawDto> retrieveDepFcltList(@Param("tmnlId") String tmnlId);

	List<DepOperHrRawDto> retrieveDepOperHrList(
		@Param("tmnlId") String tmnlId, @Param("dgRsrcId") String dgRsrcId, @Param("ymd") String ymd
	);

	List<ScCntRawDto> retrieveScCntList(
		@Param("tmnlId") String tmnlId, @Param("scRsrcId") String scRsrcId
	);
}                                                                                                            
