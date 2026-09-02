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
public class SimRsltDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	// 시뮬레이션ID
	private String simId = "";
	// 시뮬레이션결과일련번호
	private String simRsltSno = "";
	// 설치장비일련번호
	private String simModelSno = "";
	// 여객 시설코드
	private String paxFcltCd = "";
	private String simRunDttm;
	// 실제 시간
	private String simActlDt;
	private String searchDate;
	private String terNm = "";
	private String terId = "";
	private String simName = "";
	private String schdAttrGrpId = "";
	private String schdAttrGrpNm = "";
	private String fixAttrGrpId = "";
	private String fixAttrGrpNm = "";
	private String rsltCnt = "";
	private String runDt = "";
	private String paxAnnceYn = "";
	private String dateFlag = "";
}