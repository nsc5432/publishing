package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;


/**
 * @Classname : BdpsgAnceRsltDto.java
 * @Description : 승객예고 셔틀트레인 스케쥴실적 Dto & 승객예고 셔틀트레인 시뮬레이션 스케쥴실적 Dto
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 26. / 김경준 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class BdpsgAnceShtrnSchdRecDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	private String bdpsgDate = "";
	// 예정시분
	private String schdlHm = "";

	// 마감운항편명
	private String ddlnFltnm = "";
	
    // 마감운항일련번호
    private String ddlnFltSn = "";	
	
	// 예측시분
	private String predcHm = "";

	// 실제시분
	private String actlHm = "";

	// 접현시분
	private String onbHm = "";

	// 승객수
	private int bdpsgCnt = 0;

	// 예약승객수
	private int rsvtBdpsgCnt = 0;

	// 좌석수
	private int seatCnt = 0;

	// 게이트번호
	private String gateNo = "";

	// 캐로셀번호
	private String crslNo = "";

	// GD구분일자
	private String gdSeYmd = "";

	// 게이트번호(FROM)
	private int gateNoFr = 0;

	// 게이트번호(TO)
	private int gateNoTo = 0;

	// 전체도착승객수
	private int allArrPaxCnt = 0;

	// 전체출발승객수
	private int allDepPaxCnt = 0;

	// 전체승객수
	private int allPaxCnt = 0;

	// 탑승동도착승객수
	private int shtrnArrPaxCnt = 0;

	// 탑승동출발승객수
	private int shtrnDepPaxCnt = 0;

	// 탑승동승객수
	private int shtrnPaxCnt = 0;

	// 승객예고시
	private String bdpsgAnceHour = "";

	// 동편도착예상승객수
	private int eastArrPredPaxCnt = 0;

	// 서편도착예상승객수
	private int westArrPredPaxCnt = 0;

	// 도착예상승객수
	private int arrPredPaxCnt = 0;

	// 출발예상승객수
	private int depPredPaxCnt = 0;

	// 예상승객수
	private int predPaxCnt = 0;

	// 총환승객수
	private int trnsBrdgTnope = 0;

	// 툴팁
	private String toolTip = "";

	// 유임승객수
	private int crgPaxCnt = 0;

	// 무임승객수
	private int freePaxCnt = 0;

	// 이현시분
	private String ofbHm = "";

	// 도착출발구분코드
	private String arrDepSeCd = "";

	// 편건수
	private int fltCnt = 0;

	// 실건수
	private int actlCnt = 0;

	// 접현건수
	private int onbCnt = 0;

	// 이현건수
	private int ofbCnt = 0;
	
	// 현재일자
	private String curYmd = "";
	
}