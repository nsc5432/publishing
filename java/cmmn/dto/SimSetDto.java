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
public class SimSetDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	// 시뮬레이션ID
	private String smltId = "";
	// 실행일자
	private String runDt = "";
	// 계획시작일시
	private String plnStaDttm = "";
	// 계획종료일시
	private String plnEndDttm = "";
	// 시뮬레이션명
	private String simNm = "";
	// 최초등록일시
	private String fstRegiDttm = "";
	// 최초등록자ID
	private String fstRegrId = "";
	// 설치장비일련번호
	private String instlEqmtSno = "";
	// 여객시설 설명
	private String psgFcltDesc = "";
}