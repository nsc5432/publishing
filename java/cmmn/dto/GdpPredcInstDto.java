package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : GdpPredcInstDto.java
 * @Description : GDP 예측 기관 DTO
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
public class GdpPredcInstDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 생성일자
	private String crtYmd = "";
	// 생성일련번호
	private int crtSn = 0;
	// 기관일련번호
	private int instSn = 0;
	// 기관명
	private String instNm = "";
	// 기관접속URL주소
	private String instCntnUrlAddr = "";
	// 사용여부
	private String useYn = "";
	
}