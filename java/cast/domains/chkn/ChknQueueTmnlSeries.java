package aoms.pm.cast.domains.chkn;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : ChknQueueTmnlSeries.java
 * @Description : 터미널 아일랜드 공용 Queue 의 분 단위 계산 결과. 혼잡등급 기준표와 무관하다
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
public final class ChknQueueTmnlSeries {
	private final TerminalKind tmnlId;
	private final LocalDate baseDate;
	private final int originMinute;
	private final boolean[] covered;
	private final Map<String, ChknQueueSeries> seriesMap;

	/**
	 * @param originMinute 계산 시작 분 (0 이하)
	 * @param covered      [originMinute, 1440) 분마다 터미널 CC 결과가 있는지 — 결과가 없는 분은 관측하지 않은 구간이다
	 */
	public ChknQueueTmnlSeries(
			TerminalKind tmnlId,
			LocalDate baseDate,
			int originMinute,
			boolean[] covered,
			Map<String, ChknQueueSeries> seriesMap
	) {
		if (covered.length != ChknQueueSeries.MINUTE_PER_DAY - originMinute) {
			throw new IllegalArgumentException("관측 구간 길이가 계산 구간과 다릅니다. originMinute=" + originMinute + ", length=" + covered.length);
		}

		this.tmnlId = tmnlId;
		this.baseDate = baseDate;
		this.originMinute = originMinute;
		this.covered = covered.clone();
		this.seriesMap = new LinkedHashMap<>(seriesMap);
	}

	public TerminalKind getTmnlId() {
		return tmnlId;
	}

	public LocalDate getBaseDate() {
		return baseDate;
	}

	public int getOriginMinute() {
		return originMinute;
	}

	public Map<String, ChknQueueSeries> getSeriesMap() {
		return Collections.unmodifiableMap(seriesMap);
	}

	public boolean isCovered(int minute) {
		return minute >= originMinute && minute < ChknQueueSeries.MINUTE_PER_DAY && covered[minute - originMinute];
	}

	public List<String> warningList() {
		List<String> result = new ArrayList<>();

		seriesMap.values().forEach(series -> result.addAll(series.getWarningList()));

		return result;
	}
}
