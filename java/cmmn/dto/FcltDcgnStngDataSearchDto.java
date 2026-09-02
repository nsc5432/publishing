package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : FcltDcgnStngDataSearchDto.java
* @Description : 여객출현정보 DTO
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
public class FcltDcgnStngDataSearchDto extends AomsDefaultDto {
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
    private String fcltGroupCd				= "";/** 시설그룹코드 **/
    private String psgPrcsGrdCd				= "";/** 여객처리등급코드 **/
    private BigDecimal minVl				= BigDecimal.ZERO;/** 최소값 **/
    private BigDecimal maxVl				= BigDecimal.ZERO;/** 최대값 **/
    private String ntcYn					= "";/** 공지여부 **/
    private String cgnGrdYn					= "";/** 혼잡등급여부 **/
    private String frstRgtrId				= "";/** 최초등록자아이디 **/
    private String frstRgtrIpAddr			= "";/** 최초등록자IP주소 **/
    private String frstRegDt				= "";/** 최초등록일시 **/
    private String lastMdfrId				= "";/** 최종수정자아이디 **/
    private String lastMdfrIpAddr			= "";/** 최종수정자IP주소 **/
    private String lastMdfcnDt				= "";/** 최종수정일시 **/
    private int cnt                         = 0;	/** 중복체크 **/
}