package aoms.pm.castrest.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.UserSmltReqDto;
import aoms.pm.cmmn.dto.CastCheckInCounterServiceTimeDto;
import aoms.pm.cmmn.dto.CastCheckinTypeDto;
import aoms.pm.cmmn.dto.CastCounterAllocationDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblDptgDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblEmigDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblImmigDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblScrtyCntrlDto;
import aoms.pm.cmmn.dto.CastFcltyOpngTblTrnstScrtyCntrlDto;
import aoms.pm.cmmn.dto.CastFlightScheduleDto;
import aoms.pm.cmmn.dto.CastModelDto;
import aoms.pm.cmmn.dto.CastProPertySetDtlDto;
import aoms.pm.cmmn.dto.CastPropertySetDto;
import aoms.pm.cmmn.dto.CastReqGetResourceDto;
import aoms.pm.cmmn.dto.CastReqGetResourceInformationDto;
import aoms.pm.cmmn.dto.CastResReqDto;
import aoms.pm.cmmn.dto.CastRptStngHrGroupCntrlDto;
import aoms.pm.cmmn.dto.CastRsltFcltCdDto;
import aoms.pm.cmmn.dto.CastSelfCheckInCountAndBagDropDto;
import aoms.pm.cmmn.dto.CastWhatIfCntrlDto;
import aoms.pm.cmmn.dto.DwDelKeyValHstDto;
import aoms.pm.cmmn.dto.PmAtchFileDto;
import aoms.pm.cmmn.dto.SimRunStatDto;
import aoms.pm.cmmn.dto.SmltMdlDto;
import aoms.pm.cmmn.dto.SmltRsltDtlDto;

/**
 * @Classname   : UserSmltInfoMapper.java
 * @Description : 여객출현정보 관리 Mapper
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2025. 09. 12 / 이순영 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastRestMapper {
	int insertSimRunStat(SimRunStatDto dto);
	List<Object> retrieveResourceInformation(CastReqGetResourceInformationDto dto);
	CastFlightScheduleDto retrieveFlightSchedule(CastReqGetResourceDto dto);
	CastCounterAllocationDto retrieveCounterAllocation(CastReqGetResourceDto dto);
	CastSelfCheckInCountAndBagDropDto retrieveSelfCheckInCountAndBagDrop(CastReqGetResourceDto dto);
	List<Object> retrieveBeltAllocation(CastReqGetResourceDto dto);
	CastPropertySetDto retrievePropertySetMst(CastReqGetResourceDto dto);
	List<Object> retrievePropertySetSvc(CastReqGetResourceDto dto);
	List<Object> retrievePropertySetPax(CastReqGetResourceDto dto);
	List<Object> retrievePropertySetId(CastReqGetResourceDto dto);
	List<Object> retrievePropertySetPaxDtl(CastProPertySetDtlDto pax);
	CastModelDto retrieveCASTExModel(CastReqGetResourceDto dto);
	CastModelDto retrieveCASTModel(CastReqGetResourceDto dto);
	CastModelDto checkCASTModel(CastModelDto dto);
	String retrieveNewCastModelId(CastModelDto dto);
	int insertCASTModel(SmltMdlDto dto);
	int updateCASTModel(CastModelDto dto);
	int insertResult(CastResReqDto dto);
	// XML 에는 있었으나 선언이 없어 호출되지 않던 문장. 매핑 실패 시설을 여기에 남긴다
	int insertSimResultDtlRegExcl(SmltRsltDtlDto dto);
	int deleteCASTModel(CastResReqDto dto);
	SmltMdlDto retrieveModelInfo(CastResReqDto dto);
	String retrieveSimId(CastResReqDto dto);
	String checkFcltCd(CastResReqDto dto);
	List<CastRsltFcltCdDto> checkFcltCdList(CastResReqDto dto);
	int insertSimSet(CastResReqDto dto);
	int insertSimResultDtl(Map<String, Object> paramMap);
	List<Object> retrieveDelSetInfo();
	int deleteSimRsltDtl(String smltId);
	int deleteSimSetMst(String smltId);
	int insertDwDelKeyValHst(DwDelKeyValHstDto dto);
	String retrieveIdMaxPk();
	String retrieveSnoMaxPk(PmAtchFileDto dto);
	int insertAtchFile(PmAtchFileDto dto);
	CastCheckInCounterServiceTimeDto retrieveCheckInCounterServiceTime(CastReqGetResourceDto dto);
	CastCheckinTypeDto retrieveCheckinType(CastReqGetResourceDto dto);
	CastFcltyOpngTblDptgDto retrieveFcltyOpngTblDptg(CastReqGetResourceDto dto);
	CastFcltyOpngTblEmigDto retrieveFcltyOpngTblEmig(CastReqGetResourceDto dto);
	CastFcltyOpngTblImmigDto retrieveFcltyOpngTblImmig(CastReqGetResourceDto dto);
	CastFcltyOpngTblScrtyCntrlDto retrieveFcltyOpngTblScrtyCntrl(CastReqGetResourceDto dto);
	CastFcltyOpngTblTrnstScrtyCntrlDto retrieveFcltyOpngTblTrnstScrtyCntrl(CastReqGetResourceDto dto);
	CastWhatIfCntrlDto retrieveWhatIfCntrl(CastReqGetResourceDto idto);
	CastRptStngHrGroupCntrlDto retrieveRptStngHrGroupCntrl(CastReqGetResourceDto idto);
	int updateWhatIfDefinitionTableStts(CastWhatIfCntrlDto wDto);
	List<CastWhatIfCntrlDto> checkWhatIfIdList(CastWhatIfCntrlDto dto);
	int deleteWhatIfDefinitionTable(CastWhatIfCntrlDto whatIf);
	UserSmltReqDto retrieveUserReqByFsRsrcId(@Param("fltSchdlRsrcId") String fltSchdlRsrcId);
	UserSmltReqDto retrieveUserReqByKey(@Param("smltReqId") String smltReqId);
	int updateUserReqFinished(UserSmltReqDto dto);
}