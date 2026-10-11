package aoms.pm.cast.domains.dsbd;

import java.util.Map;

import lombok.extern.slf4j.Slf4j;

/**
 * @Classname : RecommendationResources.java
 * @Description : 시설 추천에 필요한 자원
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 03. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Slf4j
public final class RecommendationResources {
	private static final String EMPTY = "";
	private final Map<String, Integer> openCountMap;
	private final Map<String, AssignmentSummary> targetMap;
	private final String fixedTargetName;

	public RecommendationResources(Map<String, Integer> openCountMap, Map<String, AssignmentSummary> targetMap, String fixedTargetName) {
		this.openCountMap = openCountMap;
		this.targetMap = targetMap;
		this.fixedTargetName = fixedTargetName;
	}

	public int getOpenCountValue(String unitCd) {
		return openCountMap.getOrDefault(unitCd, 0);
	}

	public String getTargetName(String unitCd, String context) {
		if (fixedTargetName != null) {
			return fixedTargetName;
		}

		AssignmentSummary target = targetMap.get(unitCd);

		if (target == null) {
			log.warn("체크인 항공사 배정정보가 없어 추천 대상을 비움: {}", context);
			return EMPTY;
		}

		return target.getAlnNm().isEmpty() ? target.getAlnCd() : target.getAlnNm();
	}
}
