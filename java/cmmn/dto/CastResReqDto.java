package aoms.pm.cmmn.dto;

import java.util.ArrayList;
import java.util.List;

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
public class CastResReqDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String created = "";
	private String resourceType = "";
	private String author = "";
	private String description = "";
	private String lastModified = "";
	private String lastSavedBy = "";
	private String lastSavedUsingVersion = "";
	private String checkInAllocation = "";
	private String simId = "";
	private String smltMdlSn = "";
	private String startTime = "";
	private String stopTime = "";
	private String simulationStartTime = "";
	private String simulationStopTime = "";
	private String resourceID = "";
	private String tmnlId = "";
	private String selfID = "";
	private String parentID = "";
	private String flightScheduleRowID = "";
	private String bagAllocationResourceID = "";
	private String flightScheduleResourceID = "";
	private String beltAllocationResourceID = "";
	private String checkInAllocationResourceID = "";
	private String propertySetResourceID = "";
	private String modelResourceID = "";
	private String smltType = "";
	private String runID = "";
	private String checkinCounterServiceTimeResourceID = "";
	private String checkinTypeResourceID = "";
	private String facilityOpeningTableDepartureGateResourceID = "";
	private String facilityOpeningTableEmigrationResourceID = "";
	private String facilityOpeningTableImmigrationResourceID = "";
	private String facilityOpeningTableSecurityControlResourceID = "";
	private String facilityOpeningTableTransferSecurityControlResourceID = "";
	private String sbdCounterAllocationResourceID = "";
	private String paxAnnceYn = "";
	private int rsltCnt = 0;
	private String autoYn = "";
	private String smltMdlExpln = "";
	private String paxFcltCd = "";
	
	private String slfId = "";
	private String prntId = "";
	private String fltSchdlRsrcId = "";
	private String bagAlctnRsrcId = "";
	private String cknctAlctnRsrcId = "";
	private String prptSetRsrcId = "";
	private String mdlRsrcId = "";
	private String excnId = "";
	private String cknctSrvcHrRsrcId = "";
	private String chknTypeRsrcId = "";
	private String fcltyOpngTblDgRsrcId = "";
	private String fcltyOpngTblEmiRsrcId = "";
	private String fcltyOpngTblImmiRsrcId = "";
	private String fclthOpngTblScrtyCntrlRsrcId = "";
	private String fcltyOpngTblTrScrtyCntrlRsrcId = "";
	private String sbdCntrlAlctnId = "";	
	
	private List<CastRsltRunDto> resourceContent = new ArrayList<>();
	private List<CastRsltAssignmentDto> rsltAssignment = new ArrayList<>();
	private List<CastRsltDemandDto> rsltDemand = new ArrayList<>();

	public List<CastRsltRunDto> getResourceContent() {
		List<CastRsltRunDto> newRsContent = new ArrayList<>();
		newRsContent.addAll(resourceContent);
		return newRsContent;
	}

	public List<CastRsltAssignmentDto> getRsltAssignment() {
		List<CastRsltAssignmentDto> newRsltAssignment = new ArrayList<>();
		newRsltAssignment.addAll(rsltAssignment);
		return newRsltAssignment;
	}

	public List<CastRsltDemandDto> getRsltDemand() {
		List<CastRsltDemandDto> newRsltDemand = new ArrayList<>();
		newRsltDemand.addAll(rsltDemand);
		return newRsltDemand;
	}

	@Override
	public String toString() {
		return "CastResReqDto [created=" + created + ", resourceType=" + resourceType + ", resourceID=" + resourceID
				+ ", author=" + author + ", description=" + description + ", lastModified=" + lastModified
				+ ", lastSavedBy=" + lastSavedBy + ", lastSavedUsingVersion=" + lastSavedUsingVersion
				+ ", flightScheduleResourceID=" + flightScheduleResourceID + ", beltAllocationResourceID=" + beltAllocationResourceID
				+ ", checkInAllocation=" + checkInAllocation + ", modelResourceID=" + modelResourceID + ", simId=" + simId + ", runID=" + runID + ", startTime=" + startTime
				+ ", stopTime=" + stopTime + ", simulationStartTime=" + simulationStartTime + ", simulationStopTime=" + simulationStopTime 
				+ ", selfID=" + selfID + ", parentID=" + parentID + ", rsltCnt=" + rsltCnt + ", autoYn=" + autoYn + ", paxFcltCd=" + paxFcltCd
				+ ", resourceContent=" + resourceContent + ", rsltAssignment=" + rsltAssignment + ", rsltDemand=" + rsltDemand + "]";
	}
}