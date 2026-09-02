package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**                                                                                
* @Classname   : FltDataSearchDto.java                                            
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
public class FltDataSearchDto extends AomsDefaultDto {

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

	private String schdlHmStart				= "";	/** 검색 : 시작 시간 **/
	private String schdlHmEnd				= "";	/** 검색 : 종료 시간 **/

	private String fltshId                  = "";	/** 운항편아이디 **/
    private String gdSeYmd                  = "";	/** 입출항보고서구분일자 **/
    private String arrDepSeCd               = "";	/** 도착출발구분코드 **/
    private String alnCd					= "";   /** 항공사코드 **/
    private String schdlHm                  = "";	/** 일정시분 **/
    private String mstrFltnm                = "";	/** 마스터운항편명 **/
    private String arptCd                   = "";	/** 공항코드 **/
    private String predcYmd                 = "";	/** 예측일자 **/
    private String predcHm                  = "";	/** 예측시분 **/
    private String fltYn                    = "";	/** 운항여부 **/
    private String domIntlSeCd              = "";	/** 국내국제구분코드 **/
    private String actlYmd                  = "";	/** 실제일자 **/
    private String actlHm                   = "";	/** 실제시분 **/
    private String tmnlId                   = "";	/** 터미널아이디 **/
    private String gateNo                   = "";	/** 게이트번호 **/
    private String acstNo                   = "";	/** 주기장번호 **/
    private String lkfltNm                  = "";	/** 연결편명 **/
    private String fryYn                    = "";	/** 페리여부 **/
    private String lkfltYmd                 = "";	/** 연결편일자 **/
    private String crslNo                   = "";	/** 캐로셀번호 **/
    private BigDecimal rsvtBdpsgCnt         = BigDecimal.ZERO;	/** 예약탑승객수 **/
    private BigDecimal rsvtTrnsBdpsgCnt     = BigDecimal.ZERO;	/** 예약환승탑승객수 **/
    private BigDecimal domTrnsTnobp         = BigDecimal.ZERO;	/** 국내환승총탑승객수 **/
    private BigDecimal intlTrnsTnobp        = BigDecimal.ZERO;	/** 국제환승총탑승객수 **/
    private BigDecimal pfrBrdgTnope         = BigDecimal.ZERO;	/** 유임탑승총인원수 **/
    private BigDecimal freeBrdgTnope        = BigDecimal.ZERO;	/** 무임탑승총인원수 **/
    private BigDecimal trnsBrdgTnope        = BigDecimal.ZERO;	/** 환승탑승총인원수 **/
    private String arcftTypeCd              = "";	/** 항공기유형코드 **/
    private String arcftRegNo               = "";	/** 항공기등록번호 **/
    private String fltnm                    = "";	/** 운항편명 **/
    private BigDecimal trnstBdpsgCnt        = BigDecimal.ZERO;	/** 통과탑승객수 **/
    private String arcftSubtypeCd           = "";	/** 항공기상세유형코드 **/
    private BigDecimal arcftStgcp           = BigDecimal.ZERO;	/** 항공기좌석수 **/
    private BigDecimal loadSumWt            = BigDecimal.ZERO;	/** 적재합계중량 **/
    private String tdfltYn                  = "";	/** 환승전용내항기여부 **/
    private String foisFltInfoId            = "";	/** FOIS운항정보아이디 **/
    private String alnIcaoCd                = "";	/** 항공사ICAO코드 **/
    private String mstrFltshId              = "";	/** 마스터운항편아이디 **/
    private String lkfltId                  = "";	/** 연결편아이디 **/
    private String dlyYn                    = "";	/** 지연여부 **/
    private String fltCnlYn                 = "";	/** 운항취소여부 **/
    private String fltCnlRsnCd              = "";	/** 운항취소사유코드 **/
    private String fltCnlArptCd             = "";	/** 운항취소공항코드 **/

}
