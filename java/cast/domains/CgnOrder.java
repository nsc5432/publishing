package aoms.pm.cast.domains;

import java.util.Collection;
import java.util.Comparator;
import java.util.Objects;
import java.util.function.Function;
import java.util.function.ToIntFunction;

import aoms.pm.cast.enums.CongestionStatus;

/**
 * @Classname : CgnOrder.java
 * @Description : 혼잡 시설 정렬 / 대표 등급 — 요약보기 카드 / 맵형태보기 / 출국장 / 체크인 알림 공용
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class CgnOrder {
	private CgnOrder() {
		throw new UnsupportedOperationException("CgnOrder Class is Utility class.");
	}

	/** 평균 대기시간 내림차순. 산정 불가(null)는 뒤로, 같으면 대기인원 내림차순, 그다음 시설 코드 오름차순 */
	public static <T> Comparator<T> byWaitDesc(Function<T, Double> avgWtngSec, ToIntFunction<T> wtngPsgCnt, Function<T, String> unitCd) {
		return Comparator.comparing(avgWtngSec, Comparator.nullsLast(Comparator.<Double>reverseOrder()))
				.thenComparing(Comparator.comparingInt(wtngPsgCnt).reversed())
				.thenComparing(unitCd, Comparator.nullsLast(Comparator.<String>naturalOrder()));
	}

	/** 산정 가능한 시설 중 최고 심각도. 전부 산정 불가면 null — 미관측을 FREE 로 간주하지 않는다 */
	public static CongestionStatus worstOf(Collection<CongestionStatus> statusList) {
		return statusList.stream()
				.filter(Objects::nonNull)
				.max(Comparator.naturalOrder())
				.orElse(null);
	}
}
