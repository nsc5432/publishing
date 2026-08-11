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
	/** 터미널 1개분 여객시설 전량 (미사용 포함 — 화면이 미사용도 보여 준다) */
	List<FcltMapItemDto> retrieveFcltMapList(@Param("fcltTmnlId") String fcltTmnlId);

	/**
	 * 저장하려는 시뮬레이션시설명 가운데 <b>다른 시설이 이미 쓰고 있는</b> 이름.
	 * 여객시설과 시뮬레이션 시설은 1:1 이어야 한다 — 둘이 같은 이름을 보면
	 * 엔진이 어느 쪽 결과를 그 시설에 돌려줄지 알 수 없다.
	 */
	List<String> retrieveDuplicateSmltFcltNmList(@Param("itemList") List<FcltMapSaveItemDto> itemList);

	/** 시뮬레이션시설명 1건 수정 */
	int updateSmltFcltNm(
			@Param("psgFcltCd") String psgFcltCd,
			@Param("smltFcltNm") String smltFcltNm,
			@Param("fcltTmnlId") String fcltTmnlId,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);
}
