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
public class ParaVrfcCfcDto extends AomsDefaultDto {
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
    private String swtcFncId				= "";
    private String vrfcFncId				= "";
    private String alnCd					= "";
	private String fncNm					= "";
	private String totBgngYmd				= "";
	private String totEndYmd				= "";
	private String delYn					= "";
	private String tmnlId					= "";
	private String predcVrblVrfcExpln		= "";	
    private String fcltySeCd				= "";
    private String fcltySeCdNm				= "";
	private String dstbTypeCd				= "";
	private BigDecimal minVl				= BigDecimal.ZERO;
	private BigDecimal maxVl				= BigDecimal.ZERO;
	private BigDecimal dstbMaxVl			= BigDecimal.ZERO;
	private BigDecimal minErorRt			= BigDecimal.ZERO;
	private BigDecimal maxErorRt			= BigDecimal.ZERO;
	private String totDt					= "";
	private String saveType					= "";
    private int cnt                         = 0;	/** 중복체크 **/
}