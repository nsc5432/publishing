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
public class SimRsltDtlDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String smltId = "";
	
	private String smltMdlSn = "";
	private String smltRsltSn = "";
	private String smltExcnDt = "";
	private String smltActlDt = "";
	private String psgFcltCd = "";
	private String relEventCnt = "";
	private String wtngPsgCnt = "";
	private String trnstPsgCnt = "";
	private String avgPrcsHr = ""; 
	private String minPrcsHr = ""; 
	private String maxPrcsHr = ""; 
	private String avgWtngHr = ""; 
	private String minWtngHr = ""; 
	private String maxWtngHr = ""; 
	private String indvReqAvgArea = "";	
	
	// 시뮬레이션ID
	private String simId = "";
	// 시뮬레이션결과일련번호
	private String simRsltSno = "";
	// 설치장비일련번호
	private String simModelSno;
	// 여객 시설코드
	private String paxFcltCd;
	// 여객 시설 설명
	private String paxFcltDesc;
	// 결과 항목 코드
	private String simRsltItmCd;
	private String simRunDttm;
	// 실제 시간
	private String simActlDttm;
	// 연관 이벤트 수
	private int relatedEventCnt;
	// 대기 여객 수
	private int wtngPaxCnt;
	// 통과 여객 수
	private int passPaxCnt;
	// 평균 처리시간(초)
	private int avgDealTime;
	// 최소 처리시간(초)
	private int minDealTime;
	// 최대 처리시간(초)
	private int maxDealTime;
	// 평균 대기시간(초)
	private int avgWtngTime;
	// 최소 대기시간(초)
	private int minWtngTime;
	// 최대 대기시간(초)
	private int maxWtngTime;
	// 평균 대기열길이(m)
	private float avgWtngLen;
	// 최소 대기열길이(m)
	private float minWtngLen;
	// 최대 대기열길이(m)
	private float maxWtngLen;
	// 조회시작시간
	private String sDate = "";
	// 조회종료시간
	private String eDate = "";
}