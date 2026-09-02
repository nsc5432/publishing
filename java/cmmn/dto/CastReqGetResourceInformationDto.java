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
public class CastReqGetResourceInformationDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String resourceTypes = "";
	private String modelYn = "";
	private String exModelYn = "";
	private String flightYn = "";
	private String counterYn = "";
	private String beltYn = "";
	private String sbdYn = "";
	private String stYn = "";
	private String ctYn = "";
	private String dgYn = "";
	private String immiYn = "";
	private String emiYn = "";
	private String scYn = "";
	private String tsYn = "";	
	private String handleYn = "";
	private String rptYn = "";
	private String ifYn = "";

	@Override
	public String toString() {
		return "CastReqGetResourceInformationDto [resourceTypes=" + resourceTypes + ", modelYn=" + modelYn
				+ ", exModelYn=" + exModelYn + ", flightYn=" + flightYn + ", counterYn=" + counterYn + ", sbdYn="
				+ sbdYn + ", stYn=" + stYn + ", ctYn=" + ctYn + ", dgYn=" + dgYn + ", immiYn=" + immiYn
				+ ", emiYn=" + emiYn + ", scYn=" + scYn + ", tsYn=" + tsYn + ", handleYn=" + handleYn + ", rptYn=" + rptYn + "]";
	}
}