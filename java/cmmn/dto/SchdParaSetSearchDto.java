package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : UserSmltDtpgSearchDto.java
* @Description : 사용자 시뮬레이션 결과 조회 (출국장) DTO
*
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
* <pre>
* ---------------------------------------------------------------------------------
* Modification Information
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용
* 2025. 09. 12 / 이순영 / 최초작성
* ---------------------------------------------------------------------------------
*
* </pre>
*/
@Getter
@Setter
public class SchdParaSetSearchDto extends AomsDefaultDto {
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

    private String chk                      = "";	/** chk **/  
    private String tmnlId	                = "";
    private String schdlAtrbGroupId			= "";
    private String fixAtrbGroupId			= "";
    private String schdlAtrbId				= "";
    private String schdlAtrbNm				= "";
    private String useYn					= "";
    
    private String cknctAtrbNm				= "";
    private String sbdAtrbNm				= "";
    private String psgAtrbNm				= "";
    private String srvcAtrbNm				= "";
    private String cknctTypeAtrbNm			= "";
    private String cknctSrvcAtrbNm			= "";
    private String dptgtAtrbNm				= "";
    private String immigAtrbNm				= "";
    private String emigAtrbNm				= "";
    private String scrtyCntrlAtrbNm			= "";
    private String trnstScrtyCntrlAtrbNm	= "";

    private String searchDate				= "";
    
    private String cknctAtrbId				= "";
    private String sbdAtrbId				= "";
    private String psgAtrbId				= "";
    private String srvcAtrbId				= "";
    
    private String showUpAtrbId				= "";
    private String showUpAtrbNm				= "";

    private String cknctTypeAtrbId			= "";
    private String cknctAtrbGroupId			= "";
    
    private String cknctSrvcAtrbId			= "";
    
    private String dptgtAtrbId				= "";
    
    private String immigAtrbId				= "";
    
    private String emigAtrbId				= "";
    
    private String scrtyCntrlAtrbId			= "";
    
    private String trnstScrtyCntrlAtrbId	= "";
    
    private String prePrcsSn				= "";
    
    private int cnt                         = 0;	/** 중복체크 **/
}