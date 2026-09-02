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
public class CastRsltResourceDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String blockResourceID = "";
	private String selfID = "";
	private String parentID = "";
	private String t1 = "";
	private String t2 = "";
	private String transactionTimeMin = "";
	private String transactionTimeMax = "";
	private String transactionTimeAvg = "";
	private String waitingTimeMin = "";
	private String waitingTimeMax = "";
	private String waitingTimeAvg = "";
	private String finishedClientsAbs = "";
	private String waitingClientsAbs = "";
	private String queueLength = "";
	private String waitingClientsMin = "";
	private String waitingClientsMax = "";
	private String waitingClientsAvg = "";

	@Override
	public String toString() {
		return "CastRsltRunDto [blockResourceID=" + blockResourceID + ", selfID=" + selfID + ", parentID=" + parentID
				+ ", t1=" + t1 + ", t2=" + t2 + ", transactionTimeMin=" + transactionTimeMin + ", transactionTimeMax="
				+ transactionTimeMax + ", transactionTimeAvg=" + transactionTimeAvg + ", waitingTimeMin="
				+ waitingTimeMin + ", waitingTimeMax=" + waitingTimeMax + ", waitingTimeAvg=" + waitingTimeAvg + ", queueLength=" + queueLength
				+ ", finishedClientsAbs=" + finishedClientsAbs + ", waitingClientsAbs=" + waitingClientsAbs
				+ ", waitingClientsMin=" + waitingClientsMin + ", waitingClientsMax=" + waitingClientsMax
				+ ", waitingClientsAvg=" + waitingClientsAvg + "]";
	}
}