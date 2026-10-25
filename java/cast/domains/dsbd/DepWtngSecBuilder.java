package aoms.pm.cast.domains.dsbd;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;

/**
 * @Classname : DepWtngSecBuilder.java
 * @Description : 출국장 SC / SR 10분 결과를 공통 10분 구간 [e-10분, e) 의 기본 통계로 옮긴다
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
public final class DepWtngSecBuilder {
	private static final int SEC_MIN = FcltWtngSecs.SEC_MIN;

	private DepWtngSecBuilder() {
		throw new UnsupportedOperationException("DepWtngSecBuilder Class is Utility class.");
	}

	/** 저장 범위 시작 — 첫 결과 구간과 자정 이전 역추정 범위(180분) 중 이른 시각. 전날 0시보다 앞서지 않는다 */
	public static LocalDateTime rangeStartOf(LocalDate baseDate, LocalDateTime firstResultDt) {
		LocalDateTime dayStart = baseDate.atStartOfDay();
		LocalDateTime lookbackStart = dayStart.minusMinutes(DepQueueDay.LOOKBACK_MIN);

		if (firstResultDt == null) {
			return lookbackStart;
		}

		LocalDateTime firstSec = FcltWtngSecs.floorSec(firstResultDt).minusMinutes(SEC_MIN);
		LocalDateTime start = firstSec.isBefore(dayStart.minusDays(1)) ? dayStart.minusDays(1) : firstSec;

		return start.isBefore(lookbackStart) ? start : lookbackStart;
	}

	public static LocalDateTime rangeEndOf(LocalDate baseDate) {
		return baseDate.atStartOfDay().plusDays(1);
	}

	/**
	 * 출국장마다 [rangeStart, rangeEnd) 의 연속 10분 행.
	 * 터미널 결과가 있는 시각에 출국장 행만 없으면 대기 0 으로 보고 표본 건수에서는 뺀다 (기존 DepQueueWindow 해석).
	 */
	public static Map<String, List<FcltWtngSec>> build(DepQueueDay day, Collection<String> unitCdList, LocalDateTime rangeStart, LocalDateTime rangeEnd) {
		for (LocalDateTime resultDt : day.getResultDtSet()) {
			if (!FcltWtngSecs.isSecBoundary(resultDt)) {
				throw new IllegalStateException("출국장 결과 시각이 10분 경계가 아닙니다. tmnlId=" + day.getTmnlId().getValue() + ", smltActlDt=" + resultDt);
			}
		}

		Map<String, List<FcltWtngSec>> result = new LinkedHashMap<>();

		for (String unitCd : unitCdList) {
			TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap = day.getSlotMapByUnit().getOrDefault(unitCd, new TreeMap<>());
			Integer oprCnt = day.oprCntOf(unitCd);
			List<FcltWtngSec> secList = new ArrayList<>();

			for (LocalDateTime bgnDt = rangeStart; bgnDt.isBefore(rangeEnd); bgnDt = bgnDt.plusMinutes(SEC_MIN)) {
				secList.add(toSec(day, unitCd, slotMap, oprCnt, bgnDt));
			}

			result.put(unitCd, secList);
		}

		return result;
	}

	// 결과 시각 e 의 처리인원 / 대기시간 합은 [e-10분, e) 에, 종료 Queue 는 e, 시작 Queue 는 e-10분 결과에 둔다
	private static FcltWtngSec toSec(DepQueueDay day, String unitCd, TreeMap<LocalDateTime, DepQueueDay.Slot> slotMap, Integer oprCnt, LocalDateTime bgnDt) {
		LocalDateTime endDt = bgnDt.plusMinutes(SEC_MIN);
		boolean startObserved = day.hasResultAt(bgnDt);
		boolean endObserved = day.hasResultAt(endDt);
		DepQueueDay.Slot end = slotMap.get(endDt);
		Integer endQueue = endObserved ? queueOf(end) : null;
		int prcs = end == null ? 0 : end.trnstPsgCnt;
		boolean observed = startObserved && endObserved;

		return FcltWtngSec.builder()
				.unitCd(unitCd)
				.secBgngDt(bgnDt)
				.endWtngPsgCnt(endQueue)
				.prcsPsgCnt(prcs)
				.wtngPsecSum(end == null ? 0 : end.wtngSecSum)
				.wtngVldPsgCnt(end == null ? 0 : prcs - end.wtngNullPsgCnt)
				.prcsPsecSum(end == null ? 0 : end.prcsSecSum)
				.prcsVldPsgCnt(end == null ? 0 : Math.toIntExact(end.prcsPsgCnt))
				.wtngPsgCntSum(end == null ? 0 : end.wtngPsgCnt)
				.wtngNocs(end == null ? 0 : 1)
				.maxWtngPsgCnt(end == null ? null : end.wtngPsgCnt)
				.endOperCntom(oprCnt)
				.prcsCpct(null)
				.prcsVldOperCntomSum(null)
				.obsrvn(observed)
				.build();
	}

	private static int queueOf(DepQueueDay.Slot slot) {
		return slot == null ? 0 : slot.wtngPsgCnt;
	}
}
