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
public class SmltSchdDto extends AomsDefaultDto {
	private String schdlAtrbGroupId				= "";	
	private String domIntlSeCd					= "";
	private String arrDepSeCd					= "";
	private String tmnlId						= "";
	private String alnCd						= "";
	private String alnCtgry						= "";
	private String fltnm						= "";
	private String dalyFltshId					= "";
	private String depArrYmd					= "";
	private String depArrHm						= "";
	private String predcHm						= "";
	private String actlHm						= "";
	private String arrDepArptCd					= "";
	private String acstNo						= "";
	private String gateNo						= "";
	private String gateType						= "";
	private String arcftStgcp					= "";
	private String bdpsgCnt						= "";
	private String trnsBdpsgCnt					= "";
	private String crslNo						= "";
	private String arcftSubtypeCd				= "";
	private String cknctRangeCn					= "";
	private String slfChknPsbltyYn				= "";
	private String irrFltYn						= "";
	private String tdfltYn						= "";
	private String busNeedYn      				= "";
	private String wayoId      					= "";
	private String frstBagInputDt        		= "";
	private String lastBagInputDt        		= "";	
}