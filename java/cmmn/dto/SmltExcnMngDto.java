package aoms.pm.cmmn.dto;                                                        
                                                                                   
import java.time.LocalDateTime;

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
public class SmltExcnMngDto extends AomsDefaultDto {                                  
    private static final long serialVersionUID = 1L;                           

	private int rowCntPerPg = 30;

	private int curPgNo = 1;

	private int totRowCnt = 0;
    
    private String smltId;
    private String smltMdlSn;
    private String smltType;
    private LocalDateTime crtrDt;
    private String tmnlId;
    private String schdlAtrbGroupId;
    private String crslSchdlAtrbGroupId;
    private String cknctSchdlAtrbGroupId;
    private String fixAtrbGroupId;
    private String excnYmd;
    private LocalDateTime planBgngDt;
    private LocalDateTime planEndDt;
    private String smltNm;
    private String bdpsgAnceYn;
    private String frstRgtrId;
    private String frstRgtrIpAddr;
    private String lastMdfrId;
    private String lastMdfrIpAddr;
    private String userNm;
    private String deptNm;
}