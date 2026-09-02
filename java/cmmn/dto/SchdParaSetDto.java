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
public class SchdParaSetDto extends AomsDefaultDto {
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
    private String schdlAtrbGroupId			= "";
    private String atrbGroupNm				= "";
    private String cfmtnYn					= "";
    private String groupPrcsSttsCd			= "";
    private String setCnt					= "";
    private String frstRgtrId               = "";	/** 최초등록자아이디 **/
    private String frstRgtrIpAddr           = "";	/** 최초등록자IP주소 **/
    private String frstRegDt                = "";	/** 최초등록일시 **/
    private String lastMdfrId               = "";	/** 최종수정자아이디 **/
    private String lastMdfrIpAddr           = "";	/** 최종수정자IP주소 **/
    private String lastMdfcnDt              = "";	/** 최종수정일시 **/
    private String arrDepSeCd				= "";
    private String fltnm					= "";
    private String depArrYmd				= "";
    private String depArrHm					= "";
    private String alnCd					= "";
    private String domIntlSeCd				= "";
    private String tmnlId					= "";
    private String predcHm					= "";
    private String actlHm					= "";
    private String arrDepArptCd				= "";
    private String acstNo					= "";
    private String gateNo					= "";
    private String arcftStgcp				= "";
    private String bdpsgCnt					= "";
    private String trnsBdpsgCnt				= "";
    private String crslNo					= "";
    private String dalyFltshId				= "";
    private String arcftSubtypeCd			= "";
    private String cknctRangeCn				= "";
    private String irrFltYn					= "";
    private String tdfltYn    				= "";
    private String cknctId					= "";
    private String chknOpenPrnmntDt			= "";
    private String chknClosePrnmntDt		= "";
    private String dowCd					= "";
    private String psgGrdCd					= "";
    private String operYmd					= "";
    private String crtrYmd					= "";
    private String chknPgeNo    			= "";
    private String schdlAtrbSrcTypeCd		= "";
    private String schdlAtrbSrcTypeNm		= "";
    private String schdlAtrbSrcChcTypeCd	= "";
    private String schdlAtrbSrcBgngYmd		= "";
    private String schdlAtrbSrcEndYmd		= "";
    private String saveType					= "";
    private String altmntYmd				= "";
    private String altmntSn					= "";
    private String lastBgngDt				= "";
    private String lastEndDt				= "";
    private String frstBagInputDt			= "";
    private String lastBagInputDt			= "";
    private String asnFlag    				= "";
    private String fixAtrbGroupId			= "";
    private String cfmtnNm					= "";
    private String depth1					= "";
    private String depth1Nm					= "";
    private String cndTyCd					= "";
    private String psgAttrCd				= "";
    private String psgAttrCdNm				= "";
    private String psgDtlSeCd				= "";
    private String psgDtlSeCdNm				= "";
    private String inptVl					= "";
    private String userDef1Vl				= "";
    private String userDef2Vl				= "";
    private String svcAttrCd				= "";
    private String svcAttrCdNm				= "";
    private String inputVal					= "";
    private String distTyCd					= "";
    private String distTyCdNm				= "";
    private String cMinVal					= "";
    private String cMaxVal					= "";
    private String svcDtlSeCd				= "";
    private String cDistMaxVal				= "";
    private String vMinVal					= "";
    private String vMaxVal					= "";
    private String vDistMaxVal				= "";
    private String minErorRt				= "";
    private String maxErorRt				= "";
    private String swtcFncId				= "";
    private String vrfcFncId    			= "";
    private String alnCtgry					= "";
    private String gateType					= "";
    private String slfChknPsbltyYn			= "";
    private String busNeedYn				= "";
    private String wayoId					= "";
    private String blckId					= "";
    private String chknGrdCd				= "";
    private String chknGroupCd				= "";
    private String chknKndCd				= "";
    private String chknFwkCd				= "";
    private String chknTypeCd				= "";
    private String chknTypeDtlInfo			= "";
    private String staHm					= "";
    private String endHm    				= "";
    private String operBgngDt               = "";
    private String operEndDt                = "";
    private String chknGroupId				= "";
    private String chkYn	    			= "N";   
    private String schdlAtrbId				= "";
    private String schdlAtrbNm				= "";   
    private String psgAtrbId				= "";
    private String psgAtrbNm				= "";
    private String prcsSttsCd				= "";
    private String prcsSttsNm				= "";
    private String useYn    				= "";
    
    private String cknctAtrbId				= "";
    private String cknctAtrbNm				= "";
    
    private String sbdAtrbId				= "";
    private String sbdAtrbNm				= "";
    
    private String psgAtrbCd				= "";
    private String psgAtrbCdNm				= "";
    
    private String srvcAtrbId				= "";
    private String srvcAtrbNm				= "";
    
    private String fcltySeCd				= "";
    private String fcltySeCdNm				= "";
    private String vlType    				= "";
    private String fcltyDtlCd				= "";
    
    private String showUpAtrbId				= "";
    private String showUpAtrbNm				= "";
    
    private String cknctTypeAtrbId			= "";
    private String cknctTypeAtrbNm    		= "";

    private String cknctAtrbGroupId			= "";
    private String cknctRt					= "";
    private String cknctVl					= "";
    private String kosRt					= "";
    private String kosVl					= "";
    private String mobRt					= "";
    private String mobVl    				= "";
    
    private String cknctSrvcAtrbId			= "";
    private String cknctSrvcAtrbNm    		= "";

    private String dptgtAtrbId				= "";
    private String dptgtAtrbNm				= "";
    
    private String immigAtrbId				= "";
    private String immigAtrbNm				= "";
    
    private String emigAtrbId				= "";
    private String emigAtrbNm				= "";
    
    private String scrtyCntrlAtrbId			= "";
    private String scrtyCntrlAtrbNm			= "";
    
    private String trnstScrtyCntrlAtrbId	= "";
    private String trnstScrtyCntrlAtrbNm	= "";    
    
    private String fcltyOpngAtrbGroupId		= "";
    private String fcltyOpngSn				= "";
    private String fcltSeCd					= "";
    private String fcltyTypeId				= "";
    private String sdDr						= "";
    private String fcltRcg					= "";
    private String fcltyCnt					= "";
    private String psprt					= "";
    private String immigTypeCd				= "";
    private String emigTypeCd				= "";
    
    private String avgVl    				= "";
    
    private String prePrcsSn				= "";
    private String shRt						= "";
    
    private String srvcHr					= "";
    
    private int cnt                         = 0;	/** 중복체크 **/
}