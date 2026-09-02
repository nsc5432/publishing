package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : BdpsgAnceEnvalDto.java
 * @Description : PM_탑승객예고 환경변수 & PM_탑승객예고 시뮬레이션 환경변수 DTO
 * 
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * 
 * <pre>
 *                                                                             
* ---------------------------------------------------------------------------------
* Modification Information                                                         
* ---------------------------------------------------------------------------------
* 수정일       / 수정자 / 수정내용                                                             
* 2025. 5. 26 / 김경준 / 최초작성                                                    
* ---------------------------------------------------------------------------------
 * 
 * </pre>
 */
@Getter
@Setter
public class BdpsgAnceEnvalDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 시뮬레이션 ID
	private String smltId = "";
	// 터미널ID
	private String tmnlId = "";
	// 승객예고구분코드
	private String bdpsgAnceSeCd = "";
	// 승객예고시설구분코드
	private String bdpsgAnceFcltSeCd = "";
	// 환경변수사용범위시간
	private String envalUseRangeHr = "";

	// 승객예고참조변수명
	private String bdpsgAnceRfrncVrblNm = "";
	// 환경변수시작값
	private String envalBgngVl = "";
	// 환경변수종료값
	private String envalEndVl = "";
	// 환경변수값
	private String envalVl;
	// 환경변수설명
	private String envalExpln = "";
	// 환경변수값(EA)
	private String envalVl1 = "";
	// 환경변수값(M1)
	private String envalVl2 = "";
	// 환경변수값(M2)
	private String envalVl3 = "";
	// 환경변수값(WA)
	private String envalVl4 = "";
	// 환경변수값(ME)
	private String envalVl5 = "";
	// 환경변수값(MW)
	private String envalVl6 = "";

	// 환경변수값(P1)
	private String p1 = "";
	// 환경변수값(P2)
	private String p2 = "";
	// 환경변수값(P3)
	private String p3 = "";
	// 환경변수값(P4)
	private String p4 = "";
	// 환경변수값(P5)
	private String p5 = ""; // 체크인카운터 A2 ~ M2
	private String a2 = "";
	private String b1 = "";
	private String b2 = "";
	private String c1 = "";
	private String c2 = "";
	private String d1 = "";
	private String d2 = "";
	private String e1 = "";
	private String e2 = "";
	private String f1 = "";
	private String g2 = "";
	private String h1 = "";
	private String h2 = "";
	private String j1 = "";
	private String j2 = "";
	private String k1 = "";
	private String k2 = "";
	private String l1 = "";
	private String l2 = "";
	private String m1 = "";
	private String m2 = "";

	// 체크인카운터 A1, F2, G1
	private String a1 = "";
	private String f2 = "";
	private String g1 = "";

}