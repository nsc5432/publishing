package aoms.pm.cast.domains.dsbd;

import java.util.Map;

/**
 * @Classname : RecommendationResources.java
 * @Description : 시설 추천 산정에 쓰는 한 시점의 운영자원 (유닛별 운영 대수, 체크인 대표 항공사)
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
public final class RecommendationResources {
	private final Map<String, Integer> openCountMap;
	private final Map<String, AssignmentSummary> targetMap;
	private final String fixedTargetName;

	public RecommendationResources(
			Map<String, Integer> openCountMap,
			Map<String, AssignmentSummary> targetMap,
			String fixedTargetName
	) {
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
		if (target == null || target.getAlnCd().isEmpty()) {
			throw new IllegalStateException("체크인 항공사 배정정보를 찾을 수 없습니다. " + context);
		}

		if (target.getAlnNm().isEmpty()) {
			throw new IllegalStateException("체크인 항공사명을 찾을 수 없습니다. " + context + ", alnCd=" + target.getAlnCd());
		}

		return target.getAlnNm();
	}
}
