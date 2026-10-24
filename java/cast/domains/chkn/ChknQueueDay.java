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
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.domains.queue.QueueWaitWindow;
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
	public static final int WINDOW_MIN = QueueWaitWindow.WINDOW_MIN;

	private static final String TMNL_ISLAND = "*";
	private static final double SEC_PER_MIN = 60.0;

	private final TerminalKind tmnlId;
	private final LocalDate baseDate;
	private final int originMinute;
	private final boolean[] covered;
	private final Map<String, ChknQueueSeries> seriesMap;
	private final ChknQueueSeries tmnlSeries;
	private final CgnGradeScale gradeScale;

	/**
	 * @param originMinute 계산 시작 분 (0 이하)
	 * @param covered      [originMinute, 1440) 분마다 터미널 CC 결과가 있는지 — 결과가 없는 분은 관측하지 않은 구간이다
	 */
	public ChknQueueDay(
			TerminalKind tmnlId,
			LocalDate baseDate,
			int originMinute,
			boolean[] covered,
			Map<String, ChknQueueSeries> seriesMap,
			CgnGradeScale gradeScale
	) {
		if (covered.length != ChknQueueSeries.MINUTE_PER_DAY - originMinute) {
			throw new IllegalArgumentException("관측 구간 길이가 계산 구간과 다릅니다. originMinute=" + originMinute + ", length=" + covered.length);
		}

		this.tmnlId = tmnlId;
		this.baseDate = baseDate;
		this.originMinute = originMinute;
		this.covered = covered.clone();
		this.seriesMap = new LinkedHashMap<>(seriesMap);
		this.tmnlSeries = ChknQueueSeries.merge(TMNL_ISLAND, originMinute, new ArrayList<>(seriesMap.values()));
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

	/** 평가시각 직전 30분 [evalMinute-30, evalMinute) — 카드 / 혼잡해소 팝업이 읽는 구간 */
	public ChknQueueSlot windowSlotOf(String island, int evalMinute) {
		return slotOf(island, evalMinute - WINDOW_MIN, WINDOW_MIN);
	}

	public int queueAt(String island, int minute) {
		ChknQueueSeries series = seriesMap.get(island);

		return series == null ? 0 : series.queueAt(minute);
	}

	public QueueWaitWindow waitWindowOf(String island, int evalMinute) {
		ChknQueueSeries series = seriesMap.get(island);

		if (series == null) {
			return QueueWaitWindow.unavailable("아일랜드 결과가 없습니다. island=" + island);
		}

		return series.waitWindowOf(evalMinute, historyGapOf(evalMinute));
	}

	/** 직전 30분 처리 여객 평균 대기시간 (초, 소수 원값) */
	public Computed<Double> avgWtngSecOf(String island, int evalMinute) {
		return waitWindowOf(island, evalMinute).observedAvgWtngSec();
	}

	public Computed<CongestionStatus> gradeOf(String island, int evalMinute) {
		return gradeScale.gradeOf(avgWtngSecOf(island, evalMinute));
	}

	public List<String> warningList() {
		return tmnlSeries.getWarningList();
	}

	/**
	 * 평가시각 evalMinute 의 큐 원천. 관측구간은 [evalMinute-30, evalMinute), 기준시각은 evalMinute 이다. 없는 아일랜드면 null.
	 * 배정 가능 최대 수량(시설 마스터)은 혼잡해소 팝업만 쓰므로 여기서 채우지 않는다.
	 */
	public FcltQueueSource sourceOf(String island, int evalMinute) {
		ChknQueueSeries series = seriesMap.get(island);

		if (series == null) {
			return null;
		}

		int bgnMinute = evalMinute - WINDOW_MIN;
		ChknQueueSlot slot = series.slotOf(bgnMinute, WINDOW_MIN);
		BigDecimal boothRatePerMin = series.serviceRateOf(bgnMinute, WINDOW_MIN);
		QueueWaitWindow waitWindow = series.waitWindowOf(evalMinute, historyGapOf(evalMinute));
		Computed<Double> avgWtngSec = waitWindow.observedAvgWtngSec();
		LocalDateTime dayStart = baseDate.atStartOfDay();

		return FcltQueueSource.builder()
				.tmnlId(tmnlId)
				.fcltType(FcltType.CHKN)
				.unitCd(island)
				.fcltNm(island + " 아일랜드")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(dayStart.plusMinutes(bgnMinute))
				.obsEndDt(dayStart.plusMinutes(evalMinute))
				.queueAtStart(series.queueAt(bgnMinute - 1))
				.queueAtEnd(slot.getCurrentQueue())
				.wtngEndPsgCnt(slot.getPrcsPsgCnt())
				.prcsPsgCnt(slot.getPrcsPsgCnt())
				.avgPrcsSec(boothRatePerMin == null ? null : SEC_PER_MIN / boothRatePerMin.doubleValue())
				.avgQueuePsgCnt((double) slot.getAvgQueue())
				.avgWtngSec(avgWtngSec.hasValue() ? avgWtngSec.getValue() : null)
				.oprCnt(slot.getOprBoothCnt())
				.erlangCApplicable(true)
				.waitWindow(waitWindow)
				.build();
	}

	// 없는 아일랜드면 null
	public FcltQueueClearance clearanceOf(String island, int evalMinute) {
		FcltQueueSource source = sourceOf(island, evalMinute);

		return source == null ? null : new FcltQueueClearance(source, gradeScale.getNormalUpperExclusiveSec());
	}

	// 요약보기 카드 / 혼잡해소 팝업 기본값(목표 30분)과 같은 추천. 맵형태보기 / 체크인 상세가 쓴다
	public ChknQueueRecommend recommendOf(String island, int evalMinute) {
		FcltQueueClearance clearance = clearanceOf(island, evalMinute);

		if (clearance == null) {
			return ChknQueueRecommend.NONE;
		}

		FcltQueueClearance.Recommend recommend = clearance.recommendOf(FcltQueueClearance.DFLT_TARGET_MIN);

		if (recommend.getReqCnt() == null) {
			return ChknQueueRecommend.NONE;
		}

		return new ChknQueueRecommend(recommend.getReqCnt(), recommend.getReqClear().getClearMin());
	}

	// 하루 시작에 전날 결과가 없거나 중간에 결과가 빠졌으면 당일 일부 구간만으로 평균을 내지 않는다
	private String historyGapOf(int evalMinute) {
		int bgnMinute = evalMinute - WINDOW_MIN;

		if (bgnMinute < originMinute) {
			return "직전 30분(" + bgnMinute + "분부터)을 채울 시뮬레이션 결과가 없습니다. 결과 시작=" + originMinute + "분";
		}

		for (int minute = bgnMinute; minute < evalMinute; minute++) {
			if (minute >= ChknQueueSeries.MINUTE_PER_DAY || !covered[minute - originMinute]) {
				return "직전 30분 중 시뮬레이션 결과가 없는 구간이 있습니다. minute=" + minute;
			}
		}

		return null;
	}
}
