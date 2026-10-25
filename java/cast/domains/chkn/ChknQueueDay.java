package aoms.pm.cast.domains.chkn;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.wtng.ChknQueueSlot;

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
	private final ChknQueueSeries tmnlSeries;

	public ChknQueueDay(ChknQueueTrajectory trajectory) {
		this.seriesMap = new LinkedHashMap<>(trajectory.getSeriesMap());
		this.tmnlSeries = ChknQueueSeries.merge(TMNL_ISLAND, trajectory.getOriginMinute(), new ArrayList<>(seriesMap.values()));
	}

	public List<String> islandCdList() {
		return new ArrayList<>(seriesMap.keySet());
	}

	public ChknQueueSeries tmnlSeries() {
		return tmnlSeries;
	}

	public ChknQueueSlot slotOf(String island, int bgnMinute, int minutes) {
		ChknQueueSeries series = seriesMap.get(island);

		return series == null ? ChknQueueSlot.EMPTY : series.slotOf(bgnMinute, minutes);
	}

	public int queueAt(String island, int minute) {
		ChknQueueSeries series = seriesMap.get(island);

		return series == null ? 0 : series.queueAt(minute);
	}
}
