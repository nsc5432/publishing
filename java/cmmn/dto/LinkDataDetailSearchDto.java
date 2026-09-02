package aoms.pm.cmmn.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**                                                                                
* @Classname   : LinkDataDetailSearchDto.java                                            
* @Description : 연계 데이터 상태관리 상세조회 DTO                                             
*                                                                                  
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.          
* <pre>                                                                            
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용                                                             
* 2026. 06. 29 / 노세찬 / 최초작성                                                    
* ---------------------------------------------------------------------------------
*                                                                                  
* </pre>                                                                           
*/                                                                                 
@Getter                                                                            
@Setter
public class LinkDataDetailSearchDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;                           

    private String linkYmd = "";	/** 연계일자 **/
    private String linkSysId = "";	/** 연계시스템아이디 **/
    private String msgIds = ""; /** 메시지아이디 **/
    private List<String> msgIdList;
    
    public void setMsgIdList() {
    	this.msgIdList = List.of(msgIds.split(","));
    }
}