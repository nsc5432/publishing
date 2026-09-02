package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : ChknCtrAltmntInfoDto.java
* @Description : 체크인카운터배정정보 DTO
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
public class CknctAltmntInfoSearchDto extends AomsDefaultDto {
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

    private String sysId                    = "";	/** 시스템아이디 **/
    private String msgId                    = "";	/** 메시지아이디 **/
    private String msgDt                    = "";	/** 메시지수신일시 **/
    private String msgType                  = "";	/** 메시지유형 **/
    private BigDecimal alotSn               = BigDecimal.ZERO;	/** 할당일련번호 **/
    private BigDecimal altmntSn             = BigDecimal.ZERO;	/** 배정일련번호 **/
    private String operYmd                  = "";	/** 운영일자 **/
    private String tmnlId                   = "";	/** 터미널아이디 **/
    private String chknCtrId                = "";	/** 체크인카운터아이디 **/
    private String alnCd                    = "";	/** 항공사코드 **/   
}