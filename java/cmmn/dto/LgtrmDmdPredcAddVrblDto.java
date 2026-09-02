package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : LgtrmDmdPredcAddVrblDto.java
 * @Description : 장기수요예측 추가변수 DTO
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
public class LgtrmDmdPredcAddVrblDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 생성일자
	private String crtYmd = "";
	// 생성일련번호
	private int crtSn = 0;
	// 기준연도
	private String crtrYr = "";
	// 추가변수일련번호
	private int addVrblSn = 0;
	// 추가변수특성명
	private String addVrblNatureNm = "";
	// 추가변수값
	private BigDecimal addVrblVl;
	
	private String useYn = ""; // 사용여부

}
