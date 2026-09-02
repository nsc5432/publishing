package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : GdDataDto.java
 * @Description : DTO
 * 
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * 
 * <pre>
 *                                                                             
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일       / 수정자 / 수정내용                                                             
* 2025. 05. 15 / 김경준 / 최초작성                                                    
* ---------------------------------------------------------------------------------
 * 
 * </pre>
 */
@Getter
@Setter
public class FltBrdRtDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	
	private String fltnm;
	private String gdSeYmd;
	private int arcftStgcp;
	private int brdgTnope;
	private String brdRt;
}