package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : SpsDataDto.java
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
public class SpsDataDto extends AomsDefaultDto {
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

	private int rowNo						= 0;
    private String chk                      = "";	/** chk **/  
    private String psgTrnspYmd              = "";	/** 여객운송일자 **/
    private String tmnlSeCd                 = "";	/** 터미널구분코드 **/
    private String fltnm                    = "";	/** 운항편명 **/
    private String alnCd                    = "";	/** 항공사코드 **/
    private String depPrnmntDt              = "";	/** 출발예정일시 **/
    private String depCfmtnDt               = "";	/** 출발확정일시 **/
    private String fltshId                  = "";	/** 출발운항편FIMS아이디 **/
    private String brdgGateNo               = "";	/** 탑승게이트 **/
    private String chknSn                   = "";	/** 체크인일련번호 **/
    private String gndrCd                   = "";	/** 성별코드 **/
    private String ageCd                    = "";	/** 연령코드 **/
    private String ntnltyCd                 = "";	/** 국적코드 **/
    private String depArptCd                = "";	/** 출발공항코드 **/
    private String arrArptCd                = "";	/** 도착공항코드 **/
    private String bdpsgTypeCd              = "";	/** 탑승객유형 **/
    private String trnstIstrId              = "";	/** 통과기기아이디 **/
    private String dptgtEtryYmd             = "";	/** 출국장진입일자 **/
    private String dptgtEtryHm              = "";	/** 출국장진입시분 **/
    private String predcYmd              	= "";	/** 예측일자 **/
    private String predcHm              	= "";	/** 예측시분 **/
    private String predcYmdHm				= ""; 	/** 예측일자시분 **/
    private int cnt                         = 0;	/** 중복체크 **/
    
    public SpsDataDto withPredcYmdHm(String predcYmdHm) {
    	this.predcYmdHm = predcYmdHm;
    	return this;
    }
}