package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltReqDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String smltReqId; // CAST 가 WhatIfRunID 로 읽어 가는 실행 요청 ID
	private String smltId; // 편집 draft ID
	private String tmnlId; // DB 터미널 코드 (P01/P03)
	private String excnYmd;
	private int smltFlfmtSn;
	private String rsltSmltId; // CAST 결과가 만든 TN_PM_SMLT_STNG.SMLT_ID

	private String mdlRsrcId;
	private String fltSchdlRsrcId;
	private String cknctAlctnRsrcId;
	private String sbdCntrlAlctnId;
	private String prptStngRsrcId;
	private String fcltyOpngDptcnySrngRsrcId;
	private String fcltyOpngDptcnyRsrcId;
	private String fcltyOpngEntcnyRsrcId;
	private String fcltyOpngScrtyCntrlRsrcId;
	private String fcltyOpngTrScrtyCntrlRsrcId;
	private String cknctSrvcHrRsrcId;
	private String chknTypeRsrcId;
	private String rptStngAtrbId;
	private String smltRsltSfx;

	private String smltStts; // New / Executing / Finished / Failed
	private String fromStts; // CAS 전이의 이전 상태
	private String errMsg;
}
