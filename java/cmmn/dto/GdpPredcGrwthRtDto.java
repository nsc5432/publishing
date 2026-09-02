package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : GdpPredcGrwthRtDto.java
 * @Description : GDP 예측 성장 비율 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 22. / 임소정 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class GdpPredcGrwthRtDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 생성일자
	private String crtYmd = "";
	// 생성일련번호
	private int crtSn = 0;
	// 기준연도
	private String crtrYr = "";
	// 예측대상 일련번호
	private int predcTrgtSn = 0;
	// 예측성장비율
	private double predcGrwthRt = 0.0;

	private double predcGrwthGdp = 0.0;
	
}