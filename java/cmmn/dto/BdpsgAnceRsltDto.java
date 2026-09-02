package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : BdpsgAnceRsltDto.java
 * @Description : 승객 예고 결과 DTO & 승객 예고 시뮬레이션 결과 DTO
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2025. 5. 16. / 임소정 / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Getter
@Setter
public class BdpsgAnceRsltDto extends AomsDefaultDto {	
	private static final long serialVersionUID = 1L; 
	
    // 시뮬레이션ID
    private String smltId = "";
    //
	private String bdpsgDate = "";
	//
	private String bdpsgAnceCd = "";
	// 승객예고구분코드
	private String bdpsgAnceSeCd = "";
	// 승객예고시설구분코드 도착/출발/환승 등
	private String bdpsgAnceFcltSeCd = "";
	// 승객예고일자
	private String bdpsgAnceYmd = "";
	// 승객예고시간
	private String bdpsgAnceHour = "";
	// 승객예고분
	private String bdpsgAnceMnt = "";
	// 승객예고시간대
	private String bdpsgAnceTmzn = "";
	// 대륙구분코드
	private String conSeCd = "";
	// 예상승객수
	private int estBrdgTnope;
    // 리턴 Value
    private int rtnCode = 0;
    // 리턴 Value
    private int rsltCnt = 0;

	// 도착승객수
	private int arrBdpsgCnt = 0;
	// 출발승객수
	private int depBdpsgCnt = 0;
	// 총승객수
	private int totBdpsgCnt = 0;

	// 도착편 출구
	private int eastPass = 0;
	// 도착편 출구
	private int ctLeftPass = 0;
	// 도착편 출구
	private int ctRightPass = 0;
	// 도착편 출구
	private int westPass = 0;

	private int almTy;

	// 출발편 게이트
	private int depGate1 = 0;
	// 출발편 게이트
	private int depGate2 = 0;
	// 출발편 게이트
	private int depGate3 = 0;
	// 출발편 게이트
	private int depGate4 = 0;
	// 출발편 게이트
	private int depGate5 = 0;
	// 출발편 게이트
	private int depGate6 = 0;

	// 환승 게이트
	private int tsGate1 = 0;
	// 환승 게이트
	private int tsGate2 = 0;
	// 환승 게이트
	private int tsGate3 = 0;
	// 환승 게이트
	private int tsGate4 = 0;
	// 환승 게이트
	private int tsGate5 = 0;
	// 환승 게이트
	private int tsGate6 = 0;
	// 환승 게이트
	private int tsGate7 = 0;
	// 환승 게이트
	private int tsGate8 = 0;

	// 셔틀트레인 도착편 출구
	private int stArrEastPass = 0;
	// 셔틀트레인 도착편 출구
	private int stArrWestPass = 0;

	// 셔틀트레인 도착편 출구
	private int stDepPass = 0;
	
	// 입국승객
	private int bdpsgEntcny = 0;
	// 출국승객
	private int bdpsgDptcny = 0;
	// 환승승객
	private int bdpsgTrnst = 0;

    private int depCnt;
    private int arrCnt;
    private int keCnt;
    private int ozCnt;
    
    private String tmnlId = "";

    // 입국승객예고 수
    private int epCnt;
    private int clCnt;
    private int crCnt;
    private int wpCnt;

    // 출국승객예고 수
    private int d0Cnt;
    private int d1Cnt;
    private int d2Cnt;
    private int d3Cnt;
    private int d4Cnt;
    private int d5Cnt;
    
    // 환승객예고 수
    private int t1Cnt;
    private int t2Cnt;
    private int t3Cnt;
    private int t4Cnt;
    private int t5Cnt;
    private int t6Cnt;
    private int t7Cnt;
    private int t8Cnt;
    
    // 셔틀트레인 수
    private int sdDdCnt;
    private int saEaCnt;
    private int saWaCnt;

    private int cnt10;
    private int cnt20;
    private int cnt30;
    private int cnt40;
    private int cnt50;
    private int cnt60;
    private int cntEtc;

    // 항공사 코드
	private String alnNm;

	private Integer arrBrdgTnope;
	private Integer depBrdgTnope;
	private Integer totBrdgTnope;
	
	private int recCnt;
	private int recCnt1;
	private int recCnt2;
	private int recCnt3;
	private int recCnt4;
	
	private String timeTick;
}