package aoms.pm.cmmn.dto;

import java.math.BigDecimal;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : GeneratorGoDto.java
 * @Description : 메뉴 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 01. 16. / 나용철 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class GeneratorGoDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	private String code 			= "";
	private String name 			= "";
	
	private BigDecimal rowNo 		= BigDecimal.ZERO;
	private String tableName 		= "";
	private String comments 		= "";
	private String owner    		= "";
	
	private String colNo 			= "";
	private String columnName 		= "";
	private String vwDataType 		= "";
	private String colNull 			= "";
	private String dataType 		= "";
	private BigDecimal dataLength 	= BigDecimal.ZERO;
	private String colPk 			= "";
	private String colDef 			= "";
	private String remkText 		= "";
	private String ord 				= "";
	
	private String codeName  		= "";
	
}