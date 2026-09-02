package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
* @Classname   : UserSmltDtpgSearchDto.java
* @Description : 사용자 시뮬레이션 결과 조회 (출국장) DTO
*
* @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
* <pre>
* ---------------------------------------------------------------------------------
* Modification Information
* ---------------------------------------------------------------------------------
* 수정일 / 수정자 / 수정내용
* 2025. 09. 12 / 이순영 / 최초작성
* ---------------------------------------------------------------------------------
*
* </pre>
*/
@Getter
@Setter
public class CastFlightScheduleDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	
    private String domStatus = "";
    private String flightDirection = "";
    private String depArrTerminal = "";
    private String airlineCode = "";
    private String operatorCat = "";
    private String flightNumber = "";
    private String flightNumberID = "";
    private String scheduleTime = "";
    private String estimatedTime = "";
    private String actualTime = "";
    private String airportCode = "";
    private String standNumber = "";
    private String gate = "";
    private String contactRemote = "";
    private String seats = "";
    private String paxCount = "";
    private String transferPax = "";
    private String belt = "";
    private String flightType = "";
    private String checkInRange = "";
    private String aircraftType = "";
    private String sbdAvailable = "";
    private String triangle = "";
    private String bus = "";
    private String arrivalGate = "";
    private String baggageT1 = "";
    private String baggageT2 = "";
	
    private String domIntSeCd = "";
    private String arrDepSeCd = "";
    private String terId = "";
    private String alnCd = "";
    private String fltNm = "";
    private String fltNmID = "";
    private String schdTime = "";
    private String estmTime = "";
    private String actlTime = "";
    private String arrDepAptCd = "";
    private String stndNo = "";
    private String gateNo = "";
    private String remoteGate = "";
    private String acSeatCnt = "";
    private String paxCnt = "";
    private String trpaxCnt = "";
    private String crsNo = "";
    private String acType = "";
    private String cicRangeCtt = "";
    private String irrFltYn = "";
	private String lastModified = "";
	private String trdomFltYn = "";

	@Override
	public String toString() {
		return "CastFlightScheduleDto [domIntSeCd=" + domIntSeCd
			    + ", arrDepSeCd=" + arrDepSeCd
			    + ", terId=" + terId
			    + ", alnCd=" + alnCd
			    + ", fltNm=" + fltNm
			    + ", fltNmID=" + fltNmID
			    + ", schdTime=" + schdTime
			    + ", estmTime=" + estmTime
			    + ", actlTime=" + actlTime
			    + ", arrDepAptCd=" + arrDepAptCd
			    + ", stndNo=" + stndNo
			    + ", gateNo=" + gateNo
			    + ", remoteGate=" + remoteGate
			    + ", acSeatCnt=" + acSeatCnt
			    + ", paxCnt=" + paxCnt
			    + ", trpaxCnt=" + trpaxCnt
			    + ", crsNo=" + crsNo
			    + ", acType=" + acType
			    + ", cicRangeCtt=" + cicRangeCtt
			    + ", irrFltYn=" + irrFltYn
			    + ", trdomFltYn=" + trdomFltYn
			    + "]";
	}
}