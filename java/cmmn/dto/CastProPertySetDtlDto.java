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
public class CastProPertySetDtlDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String resourceID = "";
	private String psgAtrbCd = "";
	private String cd = "";
	private String role = "";
	private String shares = "";
	private String value1 = "";
	private String value2 = "";
	private String value3 = "";
	private String value4 = "";
	private String psgFixParaCndVl = "";
	private String vlType = "";

	@Override
	public String toString() {
		return "CastPropertySetDtlDto [resourceID=" + resourceID + ", cd=" + cd + ", role=" + role + ", shares="
				+ shares + ", value1=" + value1 + ", value2=" + value2 + ", value3=" + value3 + ", value4=" + value4
				+ ", psgFixParaCndVl=" + psgFixParaCndVl + "]";
	}
}