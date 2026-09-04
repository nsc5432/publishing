package aoms.pm.cast.service.impl;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.service.CastCgnGradeService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastCgnGradeServiceImpl.java
 * @Description : 혼잡등급 기준정보 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 04. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastCgnGradeServiceImpl implements CastCgnGradeService {
	private static final Map<String, String> FCLT_GROUP_CD_MAP = Map.of(
			"CK", "01",
			"CC", "02",
			"LGT", "03",
			"SC", "04",
			"SR", "04");

	private final CastDsbdMapper castDsbdMapper;

	@Override
	public CgnGradeScale retrieveGradeScale(FcltType fcltType, String context) {
		String upPsgFcltCd = fcltType == FcltType.DEP ? "SC" : "CC";
		String fcltGroupCd = FCLT_GROUP_CD_MAP.get(upPsgFcltCd);

		if (fcltGroupCd == null) {
			throw new IllegalStateException("시설 그룹 매핑을 찾을 수 없습니다. upPsgFcltCd=" + upPsgFcltCd);
		}

		return new CgnGradeScale(
				fcltGroupCd,
				castDsbdMapper.retrievePsgPrcsGradeList(fcltGroupCd),
				context + ", fcltGroupCd=" + fcltGroupCd);
	}
}
