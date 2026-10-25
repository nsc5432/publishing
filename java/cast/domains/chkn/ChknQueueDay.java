package aoms.pm.cast.domains.chkn;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.wtng.FcltWtngSlot;

/**
 * @Classname : ChknQueueDay.java
 * @Description : 체크인 하루치 Queue
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
public final class ChknQueueDay {
	private static final String TMNL_ISLAND = "*";

	private final Map<String, ChknQueueSeries> seriesMap;
	private final ChknQueueSeries mergedSeries;

	public ChknQueueDay(ChknQueueTmnlSeries tmnlSeries) {
		this.seriesMap = new LinkedHashMap<>(tmnlSeries.getSeriesMap());
		this.mergedSeries = ChknQueueSeries.merge(TMNL_ISLAND, tmnlSeries.getOriginMinute(), new ArrayList<>(seriesMap.values()));
	}

	public List<String> islandCdList() {
		return new ArrayList<>(seriesMap.keySet());
	}

	public ChknQueueSeries mergedSeries() {
		return mergedSeries;
	}

	public FcltWtngSlot slotOf(String island, int bgnMinute, int minutes) {
		ChknQueueSeries series = seriesMap.get(island);

		return series == null ? FcltWtngSlot.EMPTY : series.slotOf(bgnMinute, minutes);
	}

	public int queueAt(String island, int minute) {
		ChknQueueSeries series = seriesMap.get(island);

		return series == null ? 0 : series.queueAt(minute);
	}
}
