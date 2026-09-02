package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : AlnDto.java
 * @Description : 항공사 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 15. / AA / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class AlnDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 항공사코드
	private String alnCd = "";
	// 항공사ICAO코드
	private String alnIcaoCd = "";
	// 항공사명
	private String alnNm = "";
	// 영문항공사명
	private String engAlnNm = "";
	// 항공사운영유형코드
	private String alnOperTypeCd = "";
	// 국가코드
	private String ntnCd = "";
	// 항공사비고
	private String alnRmrkCn = "";
	// 항공사얼라이언스코드
	private String alnAllncCd = "";
	// LCC여부
	private String lccYn = "";
	// 사용여부
	private String useYn = "";
	// 시작일자
	private String bgngYmd = "";
	// 종료일자
	private String endYmd = "";
	// 승객선호터미널ID
	private String bdpsgPrfrcTmnlId = "";
	// 화물선호터미널ID
	private String cgoPrfrcTmnlId = "";

    //항공사코드 네임 병합
    private String alnCdCustNm = "";
    //항공사영문명
    private String engCustNm = "";

}
