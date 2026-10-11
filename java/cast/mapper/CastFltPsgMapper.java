package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.UserFltPsgRawDto;
import aoms.pm.cast.dto.UserSmltFltPsgSaveDto;

/* Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved. */
@Mapper
public interface CastFltPsgMapper {
	/** tmnlIdList 가 비면 공항 전체를 집계한다. */
	List<FltPsgRawDto> retrieveFltPsgHourList(
			@Param("ymd") String ymd, @Param("tmnlIdList") List<String> tmnlIdList
	);

	UserFltPsgRawDto retrieveUserFltPsg(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	void insertUserFltPsg(UserSmltFltPsgSaveDto saveDto);

	int updateUserFltPsg(UserSmltFltPsgSaveDto saveDto);
}
