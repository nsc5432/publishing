package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.FcltMapItemDto;
import aoms.pm.cast.dto.FcltMapSaveItemDto;

/**
 * @Classname   : CastFcltMapper.java
 * @Description :  시설물 매핑 Mapper
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026. 08. 12 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
@Mapper
public interface CastFcltMapper {
	List<FcltMapItemDto> retrieveFcltMapList(@Param("fcltTmnlId") String fcltTmnlId);

	List<String> retrieveDuplicateSmltFcltNmList(@Param("itemList") List<FcltMapSaveItemDto> itemList);

	int updateSmltFcltNm(
			@Param("psgFcltCd") String psgFcltCd,
			@Param("smltFcltNm") String smltFcltNm,
			@Param("fcltTmnlId") String fcltTmnlId,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);
}
