package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : CrslAltmntInfoDto.java
* @Description : 캐로셀배정정보 DTO
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
public class CrslAltmntInfoDto extends AomsDefaultDto {
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
    private String sysId                    = "";	/** 시스템아이디 **/
    private String msgId                    = "";	/** 메시지아이디 **/
    private String msgDt                    = "";	/** 메시지수신일시 **/
    private String msgType                  = "";	/** 메시지유형 **/
    private String altmntYmd                = "";	/** 배정일자 **/
    private BigDecimal altmntSn             = BigDecimal.ZERO;	/** 배정일련번호 **/
    private String arrCurFltshId            = "";	/** 도착현행운항편아이디 **/
    private String tmnlId                   = "";	/** 터미널아이디 **/
    private String crslNo                   = "";	/** 캐로셀번호 **/
    private String wayoId                   = "";	/** 출구아이디 **/
    private String acstNo                   = "";	/** 주기장번호 **/
    private String gateNo                   = "";	/** 게이트번호 **/
    private String manSeCd                  = "";	/** 수작업구분코드 **/
    private String crslSttsCd               = "";	/** 캐로셀상태코드 **/
    private String lastBgngDt               = "";	/** 최종시작일시 **/
    private String lastEndDt                = "";	/** 최종종료일시 **/
    private String frstBagInputDt           = "";	/** 최초수하물투입일시 **/
    private String lastBagInputDt           = "";	/** 최종수하물투입일시 **/
    private String crslLckYn                = "";	/** 캐로셀잠금여부 **/
    private String crslOperRmrk             = "";	/** 캐로셀운영비고 **/
    private String crslChgRsnCd             = "";	/** 캐로셀변경사유코드 **/
    private String rsvtField1               = "";	/** 예약필드1 **/
    private String rsvtField2               = "";	/** 예약필드2 **/
    private String rsvtField3               = "";	/** 예약필드3 **/
    private int cnt                         = 0;	/** 중복체크 **/
    private String ddlnFltnm				= "";	/** 운항편명 **/
}