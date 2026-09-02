package aoms.pm.cmmn.dto;                                                        
                                                                                   
import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;                                                              
                                                                                   
/**                                                                                
* @Classname   : LinkDataDto.java                                            
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
public class LinkDataDto extends AomsDefaultDto {                                  
    private static final long serialVersionUID = 1L;                           

	private int rowCntPerPg = 30;

	private int curPgNo = 1;

	private int totRowCnt = 0;

	private int rowNo						= 0;
    private String linkYmd                  = "";	/** 연계일자 **/
    private String linkSysId                = "";	/** 연계시스템아이디 **/
    private String msgId                    = "";	/** 메시지아이디 **/
    private BigDecimal msgNocs              = BigDecimal.ZERO;	/** 메시지건수 **/
    private BigDecimal prcsCmptnNocs        = BigDecimal.ZERO;	/** 처리완료건수 **/
    private BigDecimal errNocs              = BigDecimal.ZERO;	/** 에러건수 **/
    private String lastLinkDt               = "";	/** 최종연계일시 **/
    private String lastRcptnTm              = "";	/** 최종수신시각 **/
    private String lastErrOcrnTm            = "";	/** 최종오류발생시각 **/
    private String frstRgtrId               = "";	/** 최초등록자아이디 **/
    private String frstRgtrIpAddr           = "";	/** 최초등록자IP주소 **/
    private String frstRegDt                = "";	/** 최초등록일시 **/
    private String lastMdfrId               = "";	/** 최종수정자아이디 **/
    private String lastMdfrIpAddr           = "";	/** 최종수정자IP주소 **/
    private String lastMdfcnDt              = "";	/** 최종수정일시 **/
    private int metaMsgCnt = 0;
}