package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

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
public class DalySmltSearchDto extends AomsDefaultDto {
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
    private String smltId	                = ""; /** 시뮬레이션아이디 **/
    private String smltExcnDt	            = ""; /** 시뮬레이션실행일시 **/
    private String smltActlDt	            = ""; /** 시뮬레이션실제일시 **/
    private String smltMdlSn	            = ""; /** 시뮬레이션모델일련번호 **/
    private String smltRsltSn	            = ""; /** 시뮬레이션결과일련번호 **/
    private String psgFcltCd	            = ""; /** 여객시설코드 **/
    private BigDecimal relEventCnt          = BigDecimal.ZERO;	/** 관련이벤트수 **/
    private BigDecimal wtngPsgCnt           = BigDecimal.ZERO;	/** 대기여객수 **/
    private BigDecimal trnstPsgCnt          = BigDecimal.ZERO;	/** 통과여객수 **/
    private BigDecimal avgPrcsHr            = BigDecimal.ZERO;	/** 평균처리시간 **/
    private BigDecimal minPrcsHr            = BigDecimal.ZERO;	/** 최소처리시간 **/
    private BigDecimal maxPrcsHr            = BigDecimal.ZERO;	/** 최대처리시간 **/
    private BigDecimal avgWtngHr            = BigDecimal.ZERO;	/** 평균대기시간 **/
    private BigDecimal minWtngHr            = BigDecimal.ZERO;	/** 최소대기시간 **/
    private BigDecimal maxWtngHr            = BigDecimal.ZERO;	/** 최대대기시간 **/
    private BigDecimal avgWtngLen           = BigDecimal.ZERO;	/** 평균대기길이 **/
    private BigDecimal minWtngLen           = BigDecimal.ZERO;	/** 최소대기길이 **/
    private BigDecimal maxWtngLen           = BigDecimal.ZERO;	/** 최대대기길이 **/
    private BigDecimal indvReqAvgArea       = BigDecimal.ZERO;	/** 개인소요평균면적 **/
    private String frstRgtrId               = "";	/** 최초등록자아이디 **/
    private String frstRgtrIpAddr           = "";	/** 최초등록자IP주소 **/
    private String frstRegDt                = "";	/** 최초등록일시 **/
    private String lastMdfrId               = "";	/** 최종수정자아이디 **/
    private String lastMdfrIpAddr           = "";	/** 최종수정자IP주소 **/
    private String lastMdfcnDt              = "";	/** 최종수정일시 **/  
    private int cnt                         = 0;	/** 중복체크 **/
}