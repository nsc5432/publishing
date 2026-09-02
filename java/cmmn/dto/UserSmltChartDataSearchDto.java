package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**                                                                                
* @Classname   : DalySmltChartDataSearchDto.java                                            
* @Description : undefined DTO                                             
*                                                                                  
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.          
* <pre>                                                                            
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용                                                             
* 2025. 09. 09 / 이순영 / 최초작성                                                    
* ---------------------------------------------------------------------------------
*                                                                                  
* </pre>                                                                           
*/                                                                                 
@Getter                                                                            
@Setter
public class UserSmltChartDataSearchDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

	private String calCrtrYmd				= "";	/** 검색 : 일자 **/
	private String tmnlId					= "";	/** 검색 : 터미널아이디 **/
}