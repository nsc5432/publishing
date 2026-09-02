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
public class CastResourceInformationDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String pName = "";
	private String pFriendlyName = "";
	private String pKind = "";
	private String pEnumType = "";
	private String values = "";
	private String tableID = "";
	private String author = "";
	private String description = "";
	private String lastModified = "";
	private String resourceID = "";
	private String resourceType = "";
	private String result = "";
	private String message = "";
}