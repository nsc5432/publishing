package aoms.pm.cmmn.dto;

import java.math.BigDecimal;
import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : LgtrmDmdPredcDto.java
 * @Description : 장기수요예측 DTO
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
public class LgtrmDmdPredcDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 생성일자
	private String crtYmd = "";
	private String crtYmdFr = "";
	private String crtYmdTo = "";
	// 생성일련번호
	private int crtSn = 0;
	// 기준연도
	private String crtrYr = "";
	
	/* 장기수요예측시뮬레이션 */
	// 시뮬레이션명
	private String smltNm = "";
	// 장기수요RSQ값
	private BigDecimal lgtrmDmdRsqVl;
	
	/* 장기수요예측결과 */
	// 김포공항수요예측값
	private BigDecimal gmpDmdPredcVl;
	// 인천공항수요예측값
	private BigDecimal icnDmdPredcVl;
	
	/* 장기수요예측변수 */
	// 김포공항수요실적값
	private BigDecimal gmpDmdPrfmncVl;
	// 인천공항수요실적값
	private BigDecimal icnDmdPrfmncVl;
	// gdp 실적값
	private BigDecimal gdpPrfmncVl;
	// gdp 예측값
	private BigDecimal gdpPredcVl;
	
	/* 장기수요예측추가변수 */
	// 추가변수일련번호
	private int addVrblSn = 0;
	// 추가변수특성명
	private String addVrblNatureNm = "";
	// 추가변수값
	private BigDecimal addVrblVl;
	
	private List<LgtrmDmdPredcAddVrblDto> addVrblDtos;
	
	/* GDP 예측 성장 비율 */
	// 예측대상 일련번호
	private int predcTrgtSn = 0;
	// 예측성장비율
	private double predcGrwthRt = 0.0;
	
	private double predcGrwthGdp = 0.0;
	private String useYn = ""; // 사용여부
	private String runYn = ""; // 실행여부
	private String grwthRtYn = ""; // 성장률입력여부
	private String selInst = ""; // 선택기관
	
	private int addVrblUseCnt = 0; // 추가변수 사용 수

}
