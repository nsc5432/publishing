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
public class CastReqGetResourceDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	private String resourceType = "";
	private String resourceID = "";
	private String colFilter = "";
	private String addQueryString = "";
	private String smltMdlExpln = "";
	private String fixAtrbGroupId = "";
	private String schdlAtrbGroupId = "";
	// CAST 는 요청에 날짜를 싣지 않아 서버가 채운다
	private String baseYmd = "";
	private ArrayList<CastReqGetResourceRowFilterDto> rowFilters = new ArrayList<>();

	@Override
	public String toString() {
		return "CastReqGetResourceDto [resourceTypes=" + resourceType + ", resourceID=" + resourceID + ", colFilter=" + colFilter + ", rowFilters=" + rowFilters + "]";
	}

	public List<CastReqGetResourceRowFilterDto> getRowFilters() {
		ArrayList<CastReqGetResourceRowFilterDto> newRowFilters = new ArrayList<>();
		newRowFilters.addAll(rowFilters);
		return newRowFilters;
	}
}