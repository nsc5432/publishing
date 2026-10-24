package aoms.pm.cast.domains.dsbd;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.domains.queue.QueueWaitWindow;
import aoms.pm.cast.enums.FcltType;

/**
 * @Classname : DepQueueWindow.java
 * @Description : 터미널 출국장 전체의 30분 관측구간 원천 — SC / SR 을 합산한 보안검색 Queue
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 17. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class DepQueueWindow {
	public static final int CAST_SLOT_MIN = DepQueueDay.CAST_SLOT_MIN;

	private static final int WINDOW_MIN = QueueWaitWindow.WINDOW_MIN;
	private static final int SLOT_PER_WINDOW = WINDOW_MIN / CAST_SLOT_MIN;
	private static final double EPS = 1e-9;

	private final DepQueueDay day;
	private final LocalDateTime evalDt;
	private final LocalDateTime bgnDt;
	private final String historyGap;

	/** 평가시각 evalDt 의 관측구간은 [evalDt-30분, evalDt) — 결과 시각 evalDt-20 / -10 / evalDt 세 칸과 시작 스냅샷 evalDt-30 */
	DepQueueWindow(DepQueueDay day, LocalDateTime evalDt) {
		this.day = day;
		this.evalDt = evalDt;
		this.bgnDt = evalDt.minusMinutes(WINDOW_MIN);
		this.historyGap = historyGapOf();
	}

	/** 관측구간 안에 결과가 있는 출국장 */
	public List<String> unitCdList() {
		List<String> result = new ArrayList<>();

		day.getSlotMapByUnit().forEach((unitCd, slotMap) -> {
			if (!windowOf(slotMap).isEmpty()) {
				result.add(unitCd);
			}
		});

		return result;
	}

	/** 시작 스냅샷을 포함해 결과가 한 행이라도 있는지 */
	public boolean hasResult(String unitCd) {
		TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap = day.getSlotMapByUnit().get(unitCd);

		return slotMap != null && !slotMap.subMap(bgnDt, true, evalDt, true).isEmpty();
	}

	/** 직전 30분 처리 여객 평균 대기시간 (초, 소수 원값) */
	public Computed<Double> avgWtngSecOf(String unitCd) {
		return waitWindowOf(unitCd).observedAvgWtngSec();
	}

	/** 결과가 없어도 값이 빈 원천을 돌려준다. 배정 가능 최대 수량은 혼잡해소 팝업이 채운다 */
	public FcltQueueSource sourceOf(String unitCd) {
		TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap = day.getSlotMapByUnit().getOrDefault(unitCd, new TreeMap<>());
		List<DepQueueDay.Slot> windowList = windowOf(slotMap);
		boolean present = !windowList.isEmpty();
		boolean covered = present && historyGap == null;
		QueueWaitWindow waitWindow = waitWindowOf(unitCd);
		Computed<Double> avgWtngSec = waitWindow.observedAvgWtngSec();

		return FcltQueueSource.builder()
				.tmnlId(day.getTmnlId())
				.fcltType(FcltType.DEP)
				.unitCd(unitCd)
				.fcltNm(unitCd + "번 출국장")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(bgnDt)
				.obsEndDt(evalDt)
				.queueAtStart(covered ? queueAt(slotMap, bgnDt) : null)
				.queueAtEnd(present ? queueAt(slotMap, evalDt) : null)
				.wtngEndPsgCnt(covered ? windowList.stream().mapToInt(slot -> slot.trnstPsgCnt).sum() : null)
				.prcsPsgCnt(present ? windowList.stream().mapToInt(slot -> slot.trnstPsgCnt).sum() : null)
				.avgPrcsSec(weightedPrcsSec(windowList))
				.avgQueuePsgCnt(present ? windowList.stream().mapToInt(slot -> slot.wtngPsgCnt).average().getAsDouble() : null)
				.avgWtngSec(avgWtngSec.hasValue() ? avgWtngSec.getValue() : null)
				.oprCnt(day.oprCntOf(unitCd))
				.erlangCApplicable(true)
				.waitWindow(waitWindow)
				.build();
	}

	/**
	 * 처리 이력은 10분 결과를 그 10분에 균등하게 나눈 분 단위 값이다.
	 * 잔여 대기열은 10분 결과 보존식 유입(종료 대기 - 시작 대기 + 통과)을 분 단위로 균등 분배해 FIFO 로 되짚은 근사다.
	 */
	public QueueWaitWindow waitWindowOf(String unitCd) {
		TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap = day.getSlotMapByUnit().get(unitCd);

		if (slotMap == null || windowOf(slotMap).isEmpty()) {
			return QueueWaitWindow.unavailable("직전 30분 출국장 결과가 없습니다. unitCd=" + unitCd);
		}

		double[] prcs = new double[WINDOW_MIN];
		double[] wtngSec = new double[WINDOW_MIN];
		String gap = historyGap;

		for (int slotIndex = 0; slotIndex < SLOT_PER_WINDOW; slotIndex++) {
			DepQueueDay.Slot slot = slotMap.get(bgnDt.plusMinutes((long) (slotIndex + 1) * CAST_SLOT_MIN));

			if (slot == null) {
				continue;
			}

			if (slot.wtngNullPsgCnt > 0 && gap == null) {
				gap = "대기시간이 비어 있는 처리 여객 " + slot.wtngNullPsgCnt + "명이 있습니다. dt=" + slot.dt + ", unitCd=" + unitCd;
			}

			for (int minute = 0; minute < CAST_SLOT_MIN; minute++) {
				prcs[slotIndex * CAST_SLOT_MIN + minute] = (double) slot.trnstPsgCnt / CAST_SLOT_MIN;
				wtngSec[slotIndex * CAST_SLOT_MIN + minute] = slot.wtngSecSum / CAST_SLOT_MIN;
			}
		}

		LinkedList<QueueWaitWindow.Cohort> cohortList = new LinkedList<>();
		String cohortGap = gap == null ? rebuildQueue(slotMap, cohortList, unitCd) : gap;

		return new QueueWaitWindow(prcs, wtngSec, gap, cohortList, cohortGap);
	}

	// FIFO 라 evalDt 에 남은 대기자는 가장 최근에 도착한 여객이다
	private String rebuildQueue(TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap, LinkedList<QueueWaitWindow.Cohort> cohortList, String unitCd) {
		double remaining = queueAt(slotMap, evalDt);

		for (int back = 0; back < DepQueueDay.LOOKBACK_MIN && remaining > EPS; back += CAST_SLOT_MIN) {
			LocalDateTime endDt = evalDt.minusMinutes(back);
			LocalDateTime startDt = endDt.minusMinutes(CAST_SLOT_MIN);

			if (!day.hasResultAt(endDt) || !day.hasResultAt(startDt)) {
				break;
			}

			DepQueueDay.Slot end = slotMap.get(endDt);
			int trnst = end == null ? 0 : end.trnstPsgCnt;
			double arrivalPerMin = Math.max(0, queueAt(slotMap, endDt) - queueAt(slotMap, startDt) + trnst) / (double) CAST_SLOT_MIN;

			for (int minute = 1; minute <= CAST_SLOT_MIN && remaining > EPS; minute++) {
				double take = Math.min(arrivalPerMin, remaining);

				if (take > EPS) {
					cohortList.addFirst(new QueueWaitWindow.Cohort(back + minute, take));
					remaining -= take;
				}
			}
		}

		return remaining > EPS
				? "잔여 대기열 " + Math.round(remaining) + "명의 도착 시각을 " + DepQueueDay.LOOKBACK_MIN + "분 결과 안에서 재구성하지 못했습니다. unitCd=" + unitCd
				: null;
	}

	private String historyGapOf() {
		for (int slotIndex = 0; slotIndex <= SLOT_PER_WINDOW; slotIndex++) {
			LocalDateTime dt = bgnDt.plusMinutes((long) slotIndex * CAST_SLOT_MIN);

			if (!day.hasResultAt(dt)) {
				return "직전 30분 중 출국장 시뮬레이션 결과가 없는 시각이 있습니다. dt=" + dt;
			}
		}

		return null;
	}

	private List<DepQueueDay.Slot> windowOf(TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap) {
		return new ArrayList<>(slotMap.subMap(bgnDt, false, evalDt, true).values());
	}

	private static int queueAt(Map<LocalDateTime, DepQueueDay.Slot> slotMap, LocalDateTime dt) {
		DepQueueDay.Slot slot = slotMap.get(dt);

		return slot == null ? 0 : slot.wtngPsgCnt;
	}

	private static Double weightedPrcsSec(List<DepQueueDay.Slot> slotList) {
		long sumTotal = slotList.stream().mapToLong(slot -> slot.prcsSecSum).sum();
		long weightTotal = slotList.stream().mapToLong(slot -> slot.prcsPsgCnt).sum();

		return weightTotal > 0 ? (double) sumTotal / weightTotal : null;
	}
}
