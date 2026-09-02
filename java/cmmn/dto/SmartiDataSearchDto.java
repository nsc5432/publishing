package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : SmartiDataSearchDto.java
* @Description : undefined DTO
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
public class SmartiDataSearchDto extends AomsDefaultDto {
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
    private String psgTrnspYmd              = "";	/** 여객운송일자 **/
    private String tmnlSeCd                 = "";	/** 터미널구분코드 **/
    private String fltnm                    = "";	/** 운항편명 **/
    private String alnCd                    = "";	/** 항공사코드 **/
    private String chknSn                   = "";	/** 체크인일련번호 **/
    private String chknIstrId               = "";	/** 체크인기기번호 **/
    private String chknSeCd                 = "";	/** 체크인구분코드 **/
    private String bdpsIssuYmd              = "";	/** 탑승권발급일자 **/
    private String bdpsIssuHr               = "";	/** 탑승권발급시간 **/
    private String fltshId                  = "";	/** 운항편ID **/
    private String frstRgtrId               = "";	/** 최초등록자아이디 **/
    private String frstRgtrIpAddr           = "";	/** 최초등록자IP주소 **/
    private String frstRegDt                = "";	/** 최초등록일시 **/
    private String lastMdfrId               = "";	/** 최종수정자아이디 **/
    private String lastMdfrIpAddr           = "";	/** 최종수정자IP주소 **/
    private String lastMdfcnDt              = "";	/** 최종수정일시 **/
    private String bdpsIssuYmdTmStart		= "";
    private String bdpsIssuYmdTmEnd			= "";
    private int cnt                         = 0;	/** 중복체크 **/
}