package aoms.pm.cmmn.dto;

import java.math.BigDecimal;
import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**                                                                                
* @Classname   : LinkDataSearchDto.java                                            
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
public class LinkDataSearchDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;                           

	private int rowCntPerPg = 30;
	private int curPgNo = 1;
	private int totRowCnt = 0;
	private int firstRow = 0;
	private int lastRow = 0;

	public void setPageInfo() {
		this.firstRow = (this.curPgNo - 1) * this.rowCntPerPg + 1;
		this.lastRow = (this.curPgNo - 1) * this.rowCntPerPg + this.rowCntPerPg;
	}

	private String calLinkDtFm				= "";	/** 검색 : 연계시작일자 **/
	private String calLinkDtTo				= "";	/** 검색 : 연계종료일자 **/
	private String linkSysIds				= "";   /** 연계시스템아이디(복수) **/
	private String msgIds					= "";   /** 메시지아이디(복수) **/
	private List<String> linkSysIdList;
	private List<String> msgIdList;

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
    
    public void setSysIdAndMsgIdList() {
    	this.linkSysIdList = List.of(linkSysIds.split(","));
    	this.msgIdList = List.of(msgIds.split(","));
    }
}