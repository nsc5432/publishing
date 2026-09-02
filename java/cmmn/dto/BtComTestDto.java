package aoms.pm.cmmn.dto;                                                        
                                                                                   
import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;                                                              
                                                                                   
/**                                                                                
* @Classname   : BtComTestDto.java                                            
* @Description : 업체공통클래스(샘풀) DTO                                             
*                                                                                  
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.          
* <pre>                                                                            
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용                                                             
* 2025. 02. 21 / 홍길동 / 최초작성                                                    
* ---------------------------------------------------------------------------------
*                                                                                  
* </pre>                                                                           
*/                                                                                 
@Getter                                                                            
@Setter                                                                            
public class BtComTestDto extends AomsDefaultDto {                            
                                                                                   
    private static final long serialVersionUID = 1L;                           
                                                                                   
    private String chk                      = "";	/** chk **/  
    private String classId                  = "";	/** 클래스 **/
    private BigDecimal sn                   = BigDecimal.ZERO;	/** 자동증가 **/
    private String useChk                   = "";	/** 사용여부 **/
    private String classNm                  = "";	/** 설명 **/
    private String regId                    = "";	/** 등록자ID **/
    private String regDt                    = "";	/** 등록일자 **/
    private String modId                    = "";	/** 수정자ID **/
    private String modDt                    = "";	/** 수정일자 **/
    private int cnt                         = 0;	/** 중복체크 **/  

}
