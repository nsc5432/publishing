package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.FltPsgHourDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.UserFltPsgRawDto;
import aoms.pm.cast.dto.UserSmltFltPsgSaveDto;

/**
 * @Classname   : CastFltPsgMapper.java
 * @Description :  운항편/여객수 정보 관리 Mapper
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026. 08. 07 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastFltPsgMapper {
	List<FltPsgRawDto> retrieveFltPsgHourList(
		@Param("ymd") String ymd, @Param("tmnlIdList") List<String> tmnlIdList
	);

	UserFltPsgRawDto retrieveUserFltPsg(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	List<FltPsgHourDto> retrieveUserFltPsgHourList(
			@Param("smltId") String smltId, @Param("tmnlId") String tmnlId
	);

	int updateUserFltPsg(UserSmltFltPsgSaveDto saveDto);

	void insertUserFltPsg(UserSmltFltPsgSaveDto saveDto);

	void deleteUserFltPsgHrList(UserSmltFltPsgSaveDto saveDto);

	void insertUserFltPsgHrList(UserSmltFltPsgSaveDto saveDto);
}
