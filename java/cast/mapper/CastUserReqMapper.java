package aoms.pm.cast.mapper;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.UserSmltReqDto;

/**
 * @Classname   : CastUserReqMapper.java
 * @Description : 사용자 시뮬레이션 실행 요청(TN_PM_SMLT_USER_MSTR) Mapper
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026. 08. 27 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastUserReqMapper {
	void insertUserReq(UserSmltReqDto dto);

	int retrieveActiveReqCnt(@Param("smltId") String smltId, @Param("tmnlId") String tmnlId);

	UserSmltReqDto retrieveUserReqByKey(@Param("smltReqId") String smltReqId);
}
