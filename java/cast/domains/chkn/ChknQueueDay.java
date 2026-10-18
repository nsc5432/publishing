package aoms.pm.cast.domains.chkn;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.dsbd.FcltQueueClearance;
import aoms.pm.cast.domains.dsbd.FcltQueueSource;
import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

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
	private static final double SEC_PER_MIN = 60.0;

	private final TerminalKind tmnlId;
	private final LocalDate baseDate;
	private final Map<String, ChknQueueSeries> seriesMap;
	private final ChknQueueSeries tmnlSeries;
	private final CgnGradeScale gradeScale;

	public ChknQueueDay(TerminalKind tmnlId, LocalDate baseDate, Map<String, ChknQueueSeries> seriesMap, CgnGradeScale gradeScale) {
		this.tmnlId = tmnlId;
		this.baseDate = baseDate;
		this.seriesMap = new LinkedHashMap<>(seriesMap);
		this.tmnlSeries = ChknQueueSeries.merge(TMNL_ISLAND, new ArrayList<>(seriesMap.values()));
		this.gradeScale = gradeScale;
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

	public CongestionStatus statusOf(int queuePsgCnt, String context) {
		return gradeScale.statusOf(queuePsgCnt, context);
	}

	public List<String> warningList() {
		return tmnlSeries.getWarningList();
	}

	/**
	 * 슬롯 [bgnMinute, bgnMinute+slotMin) 의 큐 원천. 기준시각은 슬롯 끝이다. 없는 아일랜드면 null.
	 * 배정 가능 최대 수량(시설 마스터)은 혼잡해소 팝업만 쓰므로 여기서 채우지 않는다.
	 */
	public FcltQueueSource sourceOf(String island, int bgnMinute, int slotMin) {
		ChknQueueSeries series = seriesMap.get(island);

		if (series == null) {
			return null;
		}

		int endMinute = Math.min(bgnMinute + slotMin, ChknQueueSeries.MINUTE_PER_DAY);
		ChknQueueSlot slot = series.slotOf(bgnMinute, endMinute - bgnMinute);
		BigDecimal boothRatePerMin = series.serviceRateOf(bgnMinute, endMinute - bgnMinute);
		LocalDateTime dayStart = baseDate.atStartOfDay();

		return FcltQueueSource.builder()
				.tmnlId(tmnlId)
				.fcltType(FcltType.CHKN)
				.unitCd(island)
				.fcltNm(island + " 아일랜드")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(dayStart.plusMinutes(bgnMinute))
				.obsEndDt(dayStart.plusMinutes(endMinute))
				.queueAtStart(series.queueAt(bgnMinute - 1))
				.queueAtEnd(slot.getCurrentQueue())
				.wtngEndPsgCnt(slot.getPrcsPsgCnt())
				.prcsPsgCnt(slot.getPrcsPsgCnt())
				.avgPrcsSec(boothRatePerMin == null ? null : SEC_PER_MIN / boothRatePerMin.doubleValue())
				.avgQueuePsgCnt((double) slot.getAvgQueue())
				.avgWtngSec(slot.getPrcsPsgCnt() > 0 ? (double) slot.getAvgWaitSec() : null)
				.oprCnt(slot.getOprBoothCnt())
				.erlangCApplicable(true)
				.build();
	}

	/** 없는 아일랜드거나 NORMAL 상한이 int 범위를 넘으면 null */
	public FcltQueueClearance clearanceOf(String island, int bgnMinute, int slotMin) {
		FcltQueueSource source = sourceOf(island, bgnMinute, slotMin);
		Integer targetQueueCnt = FcltQueueClearance.toTargetQueueCnt(gradeScale.getNormalMax());

		return source == null || targetQueueCnt == null ? null : new FcltQueueClearance(source, targetQueueCnt);
	}

	/** 요약보기 카드 / 혼잡해소 팝업 기본값(목표 30분)과 같은 추천. 맵형태보기 / 체크인 상세가 쓴다 */
	public ChknQueueRecommend recommendOf(String island, int bgnMinute, int slotMin) {
		FcltQueueClearance clearance = clearanceOf(island, bgnMinute, slotMin);

		if (clearance == null) {
			return ChknQueueRecommend.NONE;
		}

		FcltQueueClearance.Recommend recommend = clearance.recommendOf(FcltQueueClearance.DFLT_TARGET_MIN);

		if (recommend.getReqCnt() == null) {
			return ChknQueueRecommend.NONE;
		}

		return new ChknQueueRecommend(recommend.getReqCnt(), recommend.getReqClear().getClearMin());
	}
}
