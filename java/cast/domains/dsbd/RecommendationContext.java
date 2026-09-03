package aoms.pm.cast.domains.dsbd;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;

import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.enums.FcltType;

/**
 * @Classname : RecommendationContext.java
 * @Description : 시설 추천 산정 1회에서 유닛마다 되풀이되는 조회를 모아 두는 캐시
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
public final class RecommendationContext {
	private final FcltType fcltType;
	private final RollingRange range;
	private final Function<LocalDateTime, RecommendationResources> resourceLoader;
	private final Supplier<Map<String, List<SmltRsltRawDto>>> priorSlotLoader;
	private final Map<LocalDateTime, RecommendationResources> resourceCache = new LinkedHashMap<>();
	private RecommendationResources scrtyResources;
	private Map<String, List<SmltRsltRawDto>> priorSlotMap;

	public RecommendationContext(
			FcltType fcltType,
			RollingRange range,
			Function<LocalDateTime, RecommendationResources> resourceLoader,
			Supplier<Map<String, List<SmltRsltRawDto>>> priorSlotLoader
	) {
		this.fcltType = fcltType;
		this.range = range;
		this.resourceLoader = resourceLoader;
		this.priorSlotLoader = priorSlotLoader;
	}

	public RollingRange getRange() {
		return range;
	}

	public RecommendationResources getRecommendationResourcesAt(LocalDateTime dt) {
		// 보안검색대 운영 snapshot 은 시각별로 갈리지 않아 한 번만 읽는다
		if (fcltType == FcltType.DEP) {
			if (scrtyResources == null) {
				scrtyResources = resourceLoader.apply(dt);
			}

			return scrtyResources;
		}

		return resourceCache.computeIfAbsent(dt, resourceLoader);
	}

	// 결과 조회에 시설 조건이 없어 유닛마다 다시 부르면 같은 결과를 되풀이해 읽는다
	public List<SmltRsltRawDto> priorSlotsOf(String unitCd) {
		if (priorSlotMap == null) {
			priorSlotMap = priorSlotLoader.get();
		}

		return priorSlotMap.getOrDefault(unitCd, List.of());
	}
}
