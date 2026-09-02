package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : BdpsgRsvtDto.java
 * @Description : 승객 예약 DTO
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
public class BdpsgRsvtDto extends AomsDefaultDto {

	private static final long serialVersionUID = 1L;

	// 조회일자
	private String bdpsgDate = "";
	// 공항코드
	private String arptCd = "";
	// 항공사코드
	private String alnCd = "";
	// 항공사명
	private String alnNm = "";

	// 스케줄시분
	private String schdlHm = "";

	// 마감운항편명
	private String ddlnFltnm = "";
	// 도착출발구분코드
	private String arrDepSeCd = "";
	// 승객예약수
	private int rsvtBdpsgCnt = 0;
	// 예약승객 저장 여부
	private String saveRsvt = "Y";
	// 환승객수
	private Integer trnsBdpsgCnt = 0;
	// 환승객 저장 여부
	private String saveTrns = "Y";
	// 항공기좌석수
	private int arcftStgcp = 0;

	// 자동여부
	private String autoHoprCrtYn = "";

	// 오차율
	private double erorRt = 0.0;

	// 항공기좌석수
	private Integer acSeatCnt = 0;

	//현재일자 입력성공 예약편수
	private Integer bdpsgRsvtSuccessCnt = 0;

	//해당일자 항공편수
	private Integer bdpsgfltTotCnt = 0;

	//현재일자 입력완료 총 예약편수
	private Integer bdpsgRsvtTotCnt = 0;
	
	//승객예고 조회일자
	private String bdpsgDateFrom = "";
	private String bdpsgDateTo = "";
	
	//출국 게이트 배정정보 조회일자
	private String bdpsgDateGateFrom = "";
	private String bdpsgDateGateTo = "";
	
	private String displayItem = "";
	private String displayRows = "";
	
	private Integer gateCnt = 0;
	private Integer gateCpltCnt = 0;
	
    private Integer keCnt = 0;
    private Integer ozCnt = 0;
    private Integer etcCnt = 0;

    private String chgSrc;
    
    private Integer estNope;
    private Integer estStdCnt;
    private String estWgvlVl;
    private Integer bssDataCnt;
    private String estCrtv;
}
