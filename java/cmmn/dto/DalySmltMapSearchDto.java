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
public class DalySmltMapSearchDto extends AomsDefaultDto {
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
    private String psgAnlsArtclCd			= "";	/** 여객분석항목코드 **/
    private String secId					= "";	/** 구간아이디 **/
    private String secNm					= "";	/** 구간아이디명 **/
    private String totBgngYmd				= "";	/** 집계시작일자 **/
    private String totEndYmd				= "";	/** 집계종료일자 **/
    private String tmnlId					= "";	/** 터미널아이디 **/
    private String avgReqHr					= "";	/** 평균소요시간 **/
    private String minReqHr					= "";	/** 최소소요시간 **/
    private String maxReqHr					= "";	/** 최대소요시간 **/
    private String avgPpcsHr				= "";	/** 평균처리시간 **/
    private String minPrcsHr				= "";	/** 최소처리시간 **/
    private String maxPrcsHr				= "";	/** 최대처리시간 **/
    private String avgWtngHr				= "";	/** 평균대기시간 **/
    private String minWtngHr				= "";	/** 최소대기시간 **/
    private String maxWtnggHr				= "";	/** 최대대기시간 **/
    private String avgWtngLen				= "";	/** 평균대기길이 **/
    private String minWtngLen				= "";	/** 최소대기길이 **/
    private String maxWtngLen				= "";	/** 최대대기길이 **/
    private String bdpsgPrcsCnt				= "";	/** 탑승객처리수 **/           
    private String psgFcltCd				= "";	/** 여객시설코드 **/
    private String upPsgFcltCd				= "";	/** 상위여객시설코드 **/
    private String psgFcltNm				= "";	/** 여객시설명 **/
    private String psgFcltExpln				= "";	/** 여객시설설명 **/
    private String sortSeq					= "";	/** 정렬순서 **/
    private String useYn					= "";	/** 사용여부 **/
    private String smltFcltNm				= "";	/** 시뮬레이션시설명 **/           
    private String slsOcrnDt				= "";	/** 매출발생일시 **/
    private String slsOcrnHr				= "";	/** 매출발생시간 **/
    private String cncsnSlsShopCd			= "";	/** 컨세션매출매장코드 **/
    private String cncsnSlsShopNm			= "";	/** 컨세션매출매장명 **/
    private String tmnlSeCd					= "";	/** 터미널구분코드 **/
    private String flrInfo					= "";	/** 층정보 **/
    private String rgnSeCd					= "";	/** 지역구분코드 **/
    private String fcltNo					= "";	/** 시설번호 **/
    private String rentSpceNo				= "";	/** 임대공간번호 **/
    private String maleSlsAmt				= "";	/** 남자매출금액 **/
    private String fmleSlsAmt				= "";	/** 여자매출금액 **/
    private String etcSlsAmt				= "";	/** 기타매출금액 **/
    private String rokNtnltySlsAmt			= "";	/** 한국국적매출금액 **/
    private String jpnNtnltySlsAmt			= "";	/** 일본국적매출금액 **/
    private String chnNtnltySlsAmt			= "";	/** 중국국적매출금액 **/
    private String seasiaNtnltySlsAmt		= "";	/** 동남아국적매출금액 **/
    private String eurNtnltySlsAmt			= "";	/** 유럽국적매출금액 **/
    private String amrcaNtnltySlsAmt		= "";	/** 미주국적매출금액 **/
    private String oceNtnltySlsAmt			= "";	/** 대양주국적매출금액 **/
    private String mieNtnltySlsAmt			= "";	/** 중동국적매출금액 **/
    private String etcNtnltySlsAmt			= "";	/** 기타국적매출금액 **/
    private String tngsSlsAmt				= "";	/** 10대매출금액 **/
    private String twntsSlsAmt				= "";	/** 20대매출금액 **/
    private String thrtsSlsAmt				= "";	/** 30대매출금액 **/
    private String fortsSlsAmt				= "";	/** 40대매출금액 **/
    private String fiftsSlsAmt				= "";	/** 50대매출금액 **/
    private String ov62SlsAmt				= "";	/** 61세이상매출금액 **/
    private String wholSlsAmt				= "";	/** 전체매출금액 **/
    private String cncsnSlsBzentyCd			= "";	/** 컨세션매출업체코드 **/
    private String cncsnSlsBsrgtCd			= "";	/** 컨세션매출사업권코드 **/
    private String bldgCd					= "";	/** 건물코드 **/
    private String bldgNm					= "";	/** 건물명 **/
    private String usgViewRentSpceNo		= "";	/** 용도뷰임대공간번호 **/
    private String rentSpceBgngDt			= "";	/** 임대공간시작일시 **/
    private String rentSpceEndDt			= "";	/** 임대공간종료일시 **/
    private String rentCtrtNo				= "";	/** 임대계약번호 **/
    private String rentCtrtNm				= "";	/** 임대계약명 **/
    private String rentCustNm				= "";	/** 임대고객명 **/ 
    private int cnt                         = 0;	/** 중복체크 **/
}