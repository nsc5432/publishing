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
public class DwDelKeyValHstDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String delDt;
	private String tblNm;
	private String delSno;
	private String key1Vl;
	private String key2Vl;
	private String key3Vl;
	private String key4Vl;
	private String key5Vl;
	private String key6Vl;
	private String key7Vl;
	private String key8Vl;
	private String key9Vl;
	private String key10Vl;
}