package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : CastTestWhatIfDto.java
* @Description : 사용자 시뮬레이션 테스트 DTO
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
public class CastTestWhatIfDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String whatIfRunId = "";
	private String model = "";
	private String fs = "";
	private String ca = "";
	private String sbd = "";
	private String ps = "";
	private String fotdp = "";
	private String fotemi = "";
	private String fotimm = "";
	private String fotsc = "";
	private String fottsc = "";
	private String chksvctime = "";
	private String chktype = "";
	private String reftime = "";
	private String status = "";
	private String execdt = "";
	private String startdt = "";
	private String lastdt = "";
}
