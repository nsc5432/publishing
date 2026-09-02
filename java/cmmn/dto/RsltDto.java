package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : RsltDto.java
 * @Description : 결과 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 15. / 임소정 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class RsltDto extends AomsDefaultDto {
	
	private static final long serialVersionUID = 1L;

	public RsltDto() {}
	
	public RsltDto(int rsltTy, Integer rsltValue) {
		this.rsltTy = rsltTy;
		this.rsltValue = rsltValue;
	}

	public static final int RSLT_TY_INSERT = 0;

	public static final int RSLT_TY_UPDATE = 10;

	public static final int RSLT_TY_DELETE = 20;

	public static final int RSLT_TY_MAKE_EXCEL = 30;

	public static final int RSLT_TY_DELETE_EXCEL = 31;

	private int rsltTy;

	private Integer rsltValue;

	private String rsltDesc;

}
