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
public class SmltRsltDtlDto extends AomsDefaultDto {
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

    private String 	chk                      = "";	/** chk **/
    private String 	smltId = "";
	private String 	smltMdlSn = "";
	private String 	smltRsltSn = "";
	private String 	smltExcnDt = "";
	private String 	smltActlDt = "";
	private String 	psgFcltCd = "";
	private String 	psgFcltNm = "";
	private int 	relEventCd;
	private int 	wtngPsgCnt;
	private int 	trnstPsgCnt;
	private int 	avgPrcsHr; 
	private int 	minPrcsHr; 
	private int 	maxPrcsHr; 
	private int 	avgWtngHr; 
	private int 	minWtngHr; 
	private int 	maxWtngHr; 
	private float 	avgWtngLen; 
	private float 	minWtngLen; 
	private float 	maxWtngLen; 
	private String 	indvReqAvgArea = "";	
	private String 	psgFcltDesc = "";
}