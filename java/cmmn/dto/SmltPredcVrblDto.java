package aoms.pm.cmmn.dto;                                                        
                                                                                   
import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;                                                              
                                                                                   
/**                                                                                
* @Classname   : FdtyMpngDto.java                                            
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
public class SmltPredcVrblDto extends AomsDefaultDto {                                  
    private static final long serialVersionUID = 1L;                           

	private int rowCntPerPg = 30;

	private int curPgNo = 1;

	private int totRowCnt = 0;

	private int rowNo						= 0;
	private String cudFlag					= "";
    private String fncId					= "";
    private String fncNm					= "";
    private String totBgngYmd				= "";
    private String totEndYmd				= "";
    private String fncExpln					= "";
    private String delYn					= "";
    private String totDt					= "";
    private String lastMdfcnDt				= "";
    
	private String fcltySeCd				= "";
    private String fcltyDtlCd				= "";
    private String dstbTypeCd				= "";
    private String minVl					= "";
    private String maxVl					= "";
    private String dstbMaxVl				= "";
    private String minErorRt				= "";
    private String maxErorRt				= "";
    private String fcltySeCdNm				= "";
    private String saveType					= "";
}