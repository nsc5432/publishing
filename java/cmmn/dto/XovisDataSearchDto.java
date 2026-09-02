package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : XovisDataSearchDto.java
* @Description : XovisDataSearchDto DTO
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
public class XovisDataSearchDto extends AomsDefaultDto {
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
    private String unitsystemid             = "";	/**  **/
    private String messageid                = "";	/**  **/
    private String dateandtime              = "";	/**  **/
    private String occurtime                = "";	/**  **/
    private String terminal                 = "";	/**  **/
    private String island                   = "";	/**  **/
    private String deskname                 = "";	/**  **/
    private String desktype                 = "";	/**  **/
    private String queid                    = "";	/**  **/
    private String quelength                = "";	/**  **/
    private String waittime                 = "";	/**  **/
    private String exptwaittime             = "";	/**  **/
    private String histwaittime             = "";	/**  **/
    private String outratequeue             = "";	/**  **/
    private String outinpaxcnt              = "";	/**  **/
    private String overpaxrem               = "";	/**  **/
    private String alloccnter               = "";	/**  **/
    private String allocarln                = "";	/**  **/
    private String deskopen                 = "";	/**  **/
    private String outratedesk              = "";	/**  **/
    private String opentime                 = "";	/**  **/
    private String outpaxcntdesk            = "";	/**  **/
    private String totalpaxcntdesk          = "";	/**  **/
    private String proctime                 = "";	/**  **/
    private String refcol1                  = "";	/**  **/
    private String refcol2                  = "";	/**  **/
    private String refcol3                  = "";	/**  **/
    private String refcol4                  = "";	/**  **/
    private String refcol5                  = "";	/**  **/
    private String recvTime                 = "";	/**  **/
    private String dealStat                 = "";	/**  **/
    private String dealDesc                 = "";	/**  **/
    private String occurtimeStart			= "";
    private String occurtimeEnd				= "";
    private int cnt                         = 0;	/** 중복체크 **/
}