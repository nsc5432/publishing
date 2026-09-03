package aoms.pm.cast.domains.dsbd;

import java.time.LocalDateTime;

/**
 * @Classname : RollingRange.java
 * @Description : 시설 카드 집계 구간 (선택 시각 ~ +60분, 자정에서 잘린다)
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
public final class RollingRange {
	private static final int SERVICE_RATE_LOOKBACK_MIN = 60;

	private final LocalDateTime dayStart;
	private final LocalDateTime bgnDt;
	private final LocalDateTime endDt;
	private final int actualMinutes;

	public RollingRange(
			LocalDateTime dayStart,
			LocalDateTime bgnDt,
			LocalDateTime endDt,
			int actualMinutes
	) {
		this.dayStart = dayStart;
		this.bgnDt = bgnDt;
		this.endDt = endDt;
		this.actualMinutes = actualMinutes;
	}

	public LocalDateTime getServiceRateLookbackBgn() {
		LocalDateTime lookbackBgn = bgnDt.minusMinutes(SERVICE_RATE_LOOKBACK_MIN);

		return lookbackBgn.isBefore(dayStart) ? dayStart : lookbackBgn;
	}

	public LocalDateTime getBgnDt() {
		return bgnDt;
	}

	public LocalDateTime getEndDt() {
		return endDt;
	}

	public int getActualMinutes() {
		return actualMinutes;
	}
}
