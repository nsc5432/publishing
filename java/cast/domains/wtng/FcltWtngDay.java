package aoms.pm.cast.domains.wtng;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.chkn.ChknQueueRecommend;
import aoms.pm.cast.domains.chkn.ChknQueueSlot;
import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.domains.dsbd.FcltQueueClearance;
import aoms.pm.cast.domains.dsbd.FcltQueueSource;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.domains.queue.QueueWaitWindow;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : FcltWtngDay.java
 * @Description : 터미널/시설유형 하루치 10분 대기 통계와 공통 평가 — 카드 / 맵 / 체크인 상세 / 혼잡해소 팝업 공용
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
public final class FcltWtngDay {
	private static final int SEC_MIN = FcltWtngSecs.SEC_MIN;
	private static final int WINDOW_MIN = QueueWaitWindow.WINDOW_MIN;
	private static final int SEC_PER_WINDOW = WINDOW_MIN / SEC_MIN;
	private static final double SEC_PER_MIN = 60.0;

	private final TerminalKind tmnlId;
	private final FcltType fcltType;
	private final LocalDateTime dayStart;
	private final Map<String, TreeMap<LocalDateTime, FcltWtngSec>> secMapByUnit = new LinkedHashMap<>();
	private final CgnGradeScale gradeScale;

	/** @param secMap 시설별 10분 통계. 저장 결과와 Java 보완 결과가 같은 구조로 들어온다 */
	public FcltWtngDay(TerminalKind tmnlId, FcltType fcltType, LocalDate baseDate, Map<String, List<FcltWtngSec>> secMap, CgnGradeScale gradeScale) {
		if (fcltType != FcltType.CHKN && fcltType != FcltType.DEP) {
			throw new IllegalArgumentException("시설 대기 결과는 CHKN / DEP 만 다룹니다. fcltType=" + fcltType);
		}

		this.tmnlId = tmnlId;
		this.fcltType = fcltType;
		this.dayStart = baseDate.atStartOfDay();
		this.gradeScale = gradeScale;

		secMap.forEach((unitCd, secList) -> {
			TreeMap<LocalDateTime, FcltWtngSec> unitMap = new TreeMap<>();

			secList.forEach(sec -> unitMap.put(sec.getSecBgngDt(), sec));
			secMapByUnit.put(unitCd, unitMap);
		});
	}

	public LocalDateTime dtOf(int minuteOfDay) {
		return dayStart.plusMinutes(minuteOfDay);
	}

	public CgnGradeScale getGradeScale() {
		return gradeScale;
	}

	public List<String> unitCdList() {
		return new ArrayList<>(secMapByUnit.keySet());
	}

	/** 관측구간 [evalDt-30, evalDt) 안에 시설 결과가 한 번이라도 있는 시설 */
	public List<String> presentUnitCdList(LocalDateTime evalDt) {
		List<String> result = new ArrayList<>();

		for (String unitCd : secMapByUnit.keySet()) {
			if (isPresent(windowOf(unitCd, evalDt))) {
				result.add(unitCd);
			}
		}

		return result;
	}

	/** 시작 스냅샷(evalDt-30)을 포함해 시설 결과가 한 번이라도 있는지 */
	public boolean hasResult(String unitCd, LocalDateTime evalDt) {
		requireBoundary(evalDt);

		TreeMap<LocalDateTime, FcltWtngSec> secMap = secMapByUnit.getOrDefault(unitCd, new TreeMap<>());

		return secMap.subMap(evalDt.minusMinutes(WINDOW_MIN + (long) SEC_MIN), true, evalDt, false).values().stream()
				.anyMatch(sec -> sec.getWtngNocs() > 0);
	}

	/** [bgnDt, bgnDt+minutes) 의 Queue 지표. 10분 행을 다시 합산한다 */
	public ChknQueueSlot slotOf(String unitCd, LocalDateTime bgnDt, int minutes) {
		requireBoundary(bgnDt);

		if (minutes <= 0 || minutes % SEC_MIN != 0) {
			throw new IllegalArgumentException("구간 길이는 " + SEC_MIN + "분 배수여야 합니다: " + minutes);
		}

		TreeMap<LocalDateTime, FcltWtngSec> secMap = secMapByUnit.get(unitCd);

		if (secMap == null) {
			return ChknQueueSlot.EMPTY;
		}

		List<FcltWtngSec> secList = new ArrayList<>(secMap.subMap(bgnDt, true, bgnDt.plusMinutes(minutes), false).values());

		if (secList.isEmpty()) {
			return ChknQueueSlot.EMPTY;
		}

		long queueSum = 0;
		long nocs = 0;
		int maxQueue = 0;
		long prcsSum = 0;
		double wtngSecSum = 0;
		double prcsSecSum = 0;
		long prcsVldSum = 0;
		long capacitySum = 0;

		for (FcltWtngSec sec : secList) {
			queueSum += sec.getWtngPsgCntSum();
			nocs += sec.getWtngNocs();
			maxQueue = Math.max(maxQueue, valueOf(sec.getMaxWtngPsgCnt()));
			prcsSum += sec.getPrcsPsgCnt();
			wtngSecSum += sec.getWtngPsecSum();
			prcsSecSum += sec.getPrcsPsecSum();
			prcsVldSum += sec.getPrcsVldPsgCnt();
			capacitySum += sec.getPrcsCpct() == null ? 0 : sec.getPrcsCpct();
		}

		FcltWtngSec last = secList.get(secList.size() - 1);

		return new ChknQueueSlot(
				valueOf(last.getEndWtngPsgCnt()),
				nocs == 0 ? 0 : Math.toIntExact(Math.round((double) queueSum / nocs)),
				maxQueue,
				prcsSum == 0 ? 0 : Math.toIntExact(Math.round(wtngSecSum / prcsSum)),
				Math.toIntExact(prcsSum),
				prcsVldSum == 0 ? 0 : Math.toIntExact(Math.round(prcsSecSum / prcsVldSum)),
				capacitySum <= 0 ? 0 : (int) Math.min(100, prcsSum * 100 / capacitySum),
				valueOf(last.getEndOperCntom()));
	}

	/** 평가시각 직전 30분 [evalDt-30, evalDt) — 카드 / 혼잡해소 팝업이 읽는 구간 */
	public ChknQueueSlot windowSlotOf(String unitCd, LocalDateTime evalDt) {
		return slotOf(unitCd, evalDt.minusMinutes(WINDOW_MIN), WINDOW_MIN);
	}

	/**
	 * 처리 이력은 10분 합계를 그 10분에 균등하게 나눈 분 단위 근사다.
	 * 잔여 대기열은 10분 도착여객수를 분 단위로 균등 분배해 가장 최근 도착부터 FIFO 로 되짚은 근사다.
	 */
	public QueueWaitWindow waitWindowOf(String unitCd, LocalDateTime evalDt) {
		FcltWtngSec[] window = windowOf(unitCd, evalDt);
		TreeMap<LocalDateTime, FcltWtngSec> secMap = secMapByUnit.get(unitCd);

		if (secMap == null && fcltType == FcltType.CHKN) {
			return QueueWaitWindow.unavailable("아일랜드 결과가 없습니다. island=" + unitCd);
		}

		if (secMap == null || (fcltType == FcltType.DEP && !isPresent(window))) {
			return QueueWaitWindow.unavailable("직전 30분 출국장 결과가 없습니다. unitCd=" + unitCd);
		}

		double[] prcs = new double[WINDOW_MIN];
		double[] wtngSec = new double[WINDOW_MIN];
		long prcsTotal = 0;
		double wtngSecTotal = 0;

		for (int secIndex = 0; secIndex < SEC_PER_WINDOW; secIndex++) {
			FcltWtngSec sec = window[secIndex];

			if (sec == null) {
				continue;
			}

			prcsTotal += sec.getPrcsPsgCnt();
			wtngSecTotal += sec.getWtngPsecSum();

			for (int minute = 0; minute < SEC_MIN; minute++) {
				prcs[secIndex * SEC_MIN + minute] = sec.getPrcsPsgCnt() / (double) SEC_MIN;
				wtngSec[secIndex * SEC_MIN + minute] = sec.getWtngPsecSum() / SEC_MIN;
			}
		}

		String historyGap = historyGapOf(unitCd, window, evalDt);
		LinkedList<QueueWaitWindow.PsgGroup> psgGroupList = new LinkedList<>();
		String psgGroupGap = historyGap != null ? historyGap : rebuildQueue(unitCd, secMap, evalDt, psgGroupList);

		return new QueueWaitWindow(prcs, wtngSec, historyGap, psgGroupList, psgGroupGap, prcsTotal, wtngSecTotal);
	}

	/** 직전 30분 처리 여객 평균 대기시간 (초, 소수 원값). 저장한 원래 합계와 분모로 계산한다 */
	public Computed<Double> avgWtngSecOf(String unitCd, LocalDateTime evalDt) {
		return waitWindowOf(unitCd, evalDt).observedAvgWtngSec();
	}

	public Computed<CongestionStatus> gradeOf(String unitCd, LocalDateTime evalDt) {
		return gradeScale.gradeOf(avgWtngSecOf(unitCd, evalDt));
	}

	/**
	 * 평가시각 evalDt 의 큐 원천. 관측구간은 [evalDt-30, evalDt), 기준시각은 evalDt 이다.
	 * 체크인은 없는 아일랜드면 null, 출국장은 결과가 없어도 값이 빈 원천을 돌려준다.
	 */
	public FcltQueueSource sourceOf(String unitCd, LocalDateTime evalDt) {
		if (fcltType == FcltType.CHKN) {
			return secMapByUnit.containsKey(unitCd) ? chknSourceOf(unitCd, evalDt) : null;
		}

		return depSourceOf(unitCd, evalDt);
	}

	// 체크인은 없는 아일랜드면 null
	public FcltQueueClearance clearanceOf(String unitCd, LocalDateTime evalDt) {
		FcltQueueSource source = sourceOf(unitCd, evalDt);

		return source == null ? null : new FcltQueueClearance(source, gradeScale.getNormalUpperExclusiveSec());
	}

	// 요약보기 카드 / 혼잡해소 팝업 기본값(목표 30분)과 같은 추천
	public ChknQueueRecommend recommendOf(String unitCd, LocalDateTime evalDt) {
		FcltQueueClearance clearance = clearanceOf(unitCd, evalDt);

		if (clearance == null) {
			return ChknQueueRecommend.NONE;
		}

		FcltQueueClearance.Recommend recommend = clearance.recommendOf(FcltQueueClearance.DFLT_TARGET_MIN);

		if (recommend.getReqCnt() == null) {
			return ChknQueueRecommend.NONE;
		}

		return new ChknQueueRecommend(recommend.getReqCnt(), recommend.getReqClear().getClearMin());
	}

	private FcltQueueSource chknSourceOf(String unitCd, LocalDateTime evalDt) {
		FcltWtngSec[] window = windowOf(unitCd, evalDt);
		ChknQueueSlot slot = windowSlotOf(unitCd, evalDt);
		QueueWaitWindow waitWindow = waitWindowOf(unitCd, evalDt);
		Computed<Double> avgWtngSec = waitWindow.observedAvgWtngSec();
		long capacitySum = 0;
		long boothMinuteSum = 0;

		for (FcltWtngSec sec : window) {
			if (sec != null) {
				capacitySum += sec.getPrcsCpct() == null ? 0 : sec.getPrcsCpct();
				boothMinuteSum += sec.getPrcsVldOperCntomSum() == null ? 0 : sec.getPrcsVldOperCntomSum();
			}
		}

		// 부스/분당 처리용량 = 처리용량 합 / 처리용량이 양수인 분의 운영 대수 합
		Double avgPrcsSec = capacitySum <= 0 || boothMinuteSum <= 0 ? null : SEC_PER_MIN * boothMinuteSum / capacitySum;

		return FcltQueueSource.builder()
				.tmnlId(tmnlId)
				.fcltType(FcltType.CHKN)
				.unitCd(unitCd)
				.fcltNm(unitCd + " 아일랜드")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(evalDt.minusMinutes(WINDOW_MIN))
				.obsEndDt(evalDt)
				.queueAtStart(window[0] == null ? null : window[0].getBgngWtngPsgCnt())
				.queueAtEnd(slot.getCurrentQueue())
				.wtngEndPsgCnt(slot.getPrcsPsgCnt())
				.prcsPsgCnt(slot.getPrcsPsgCnt())
				.avgPrcsSec(avgPrcsSec)
				.avgQueuePsgCnt((double) slot.getAvgQueue())
				.avgWtngSec(avgWtngSec.hasValue() ? avgWtngSec.getValue() : null)
				.oprCnt(slot.getOprBoothCnt())
				.erlangCApplicable(true)
				.waitWindow(waitWindow)
				.build();
	}

	private FcltQueueSource depSourceOf(String unitCd, LocalDateTime evalDt) {
		FcltWtngSec[] window = windowOf(unitCd, evalDt);
		boolean present = isPresent(window);
		boolean covered = present && isObserved(window);
		QueueWaitWindow waitWindow = waitWindowOf(unitCd, evalDt);
		Computed<Double> avgWtngSec = waitWindow.observedAvgWtngSec();
		int prcsSum = 0;
		long queueSum = 0;
		long nocs = 0;
		double prcsSecSum = 0;
		long prcsVldSum = 0;

		for (FcltWtngSec sec : window) {
			if (sec != null) {
				prcsSum += sec.getPrcsPsgCnt();
				queueSum += sec.getWtngPsgCntSum();
				nocs += sec.getWtngNocs();
				prcsSecSum += sec.getPrcsPsecSum();
				prcsVldSum += sec.getPrcsVldPsgCnt();
			}
		}

		FcltWtngSec first = window[0];
		FcltWtngSec last = window[SEC_PER_WINDOW - 1];

		return FcltQueueSource.builder()
				.tmnlId(tmnlId)
				.fcltType(FcltType.DEP)
				.unitCd(unitCd)
				.fcltNm(unitCd + "번 출국장")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(evalDt.minusMinutes(WINDOW_MIN))
				.obsEndDt(evalDt)
				.queueAtStart(covered ? first.getBgngWtngPsgCnt() : null)
				.queueAtEnd(present && last != null ? last.getEndWtngPsgCnt() : null)
				.wtngEndPsgCnt(covered ? prcsSum : null)
				.prcsPsgCnt(present ? prcsSum : null)
				.avgPrcsSec(prcsVldSum > 0 ? prcsSecSum / prcsVldSum : null)
				.avgQueuePsgCnt(present && nocs > 0 ? (double) queueSum / nocs : null)
				.avgWtngSec(avgWtngSec.hasValue() ? avgWtngSec.getValue() : null)
				.oprCnt(depOprCntOf(unitCd))
				.erlangCApplicable(true)
				.waitWindow(waitWindow)
				.build();
	}

	// 출국장 운영 수량은 실행 리소스 운영표 값이라 하루 동안 같다
	private Integer depOprCntOf(String unitCd) {
		TreeMap<LocalDateTime, FcltWtngSec> secMap = secMapByUnit.get(unitCd);

		return secMap == null || secMap.isEmpty() ? null : secMap.lastEntry().getValue().getEndOperCntom();
	}

	// 직전 30분 세 구간이 모두 관측되고 처리 여객 전원의 대기시간이 있어야 평균을 낸다
	private String historyGapOf(String unitCd, FcltWtngSec[] window, LocalDateTime evalDt) {
		LocalDateTime bgnDt = evalDt.minusMinutes(WINDOW_MIN);

		for (int secIndex = 0; secIndex < SEC_PER_WINDOW; secIndex++) {
			FcltWtngSec sec = window[secIndex];
			LocalDateTime secDt = bgnDt.plusMinutes((long) secIndex * SEC_MIN);

			if (sec == null) {
				return "직전 30분(" + bgnDt + "부터)을 채울 시뮬레이션 결과가 없습니다. unitCd=" + unitCd + ", secBgngDt=" + secDt;
			}

			if (!sec.isObsrvn()) {
				return "직전 30분 중 시뮬레이션 결과가 없는 구간이 있습니다. unitCd=" + unitCd + ", secBgngDt=" + secDt
						+ (sec.getObsrvnRsn() == null ? "" : ", " + sec.getObsrvnRsn());
			}
		}

		for (FcltWtngSec sec : window) {
			int wtngNullPsgCnt = sec.getPrcsPsgCnt() - sec.getWtngVldPsgCnt();

			if (wtngNullPsgCnt > 0) {
				return "대기시간이 비어 있는 처리 여객 " + wtngNullPsgCnt + "명이 있습니다. unitCd=" + unitCd + ", secBgngDt=" + sec.getSecBgngDt();
			}
		}

		return null;
	}

	// FIFO 라 evalDt 에 남은 대기자는 가장 최근에 도착한 여객이다. 결과는 오래 기다린 순으로 쌓는다
	private String rebuildQueue(
			String unitCd,
			TreeMap<LocalDateTime, FcltWtngSec> secMap,
			LocalDateTime evalDt,
			LinkedList<QueueWaitWindow.PsgGroup> psgGroupList
	) {
		FcltWtngSec last = secMap.get(evalDt.minusMinutes(SEC_MIN));

		if (last == null || last.getEndWtngPsgCnt() == null) {
			return "평가시각의 잔여 대기열을 확인할 수 없습니다. unitCd=" + unitCd + ", evalDt=" + evalDt;
		}

		// 출국장은 기존 역추정 범위를 유지하고, 체크인은 저장된 계산 시작점까지 되짚는다
		int lookbackMin = fcltType == FcltType.DEP ? DepQueueDay.LOOKBACK_MIN : Integer.MAX_VALUE;
		// 분당 도착(10분 도착 / 10)을 오차 없이 빼도록 1/SEC_MIN 명 단위 정수로 센다
		long remaining = (long) last.getEndWtngPsgCnt() * SEC_MIN;

		for (int back = 0; back < lookbackMin && remaining > 0; back += SEC_MIN) {
			FcltWtngSec sec = secMap.get(evalDt.minusMinutes((long) back + SEC_MIN));

			if (sec == null || !sec.isObsrvn() || sec.getArrPsgCnt() == null
					|| sec.getBgngWtngPsgCnt() == null || sec.getEndWtngPsgCnt() == null) {
				break;
			}

			long arrivalPerMin = sec.getArrPsgCnt();

			for (int minute = 1; minute <= SEC_MIN && remaining > 0; minute++) {
				long take = Math.min(arrivalPerMin, remaining);

				if (take > 0) {
					psgGroupList.addFirst(new QueueWaitWindow.PsgGroup(back + minute, take / (double) SEC_MIN));
					remaining -= take;
				}
			}
		}

		return remaining > 0
				? "잔여 대기열 " + Math.round(remaining / (double) SEC_MIN) + "명의 도착 시각을 10분 결과 안에서 재구성하지 못했습니다. unitCd=" + unitCd
				: null;
	}

	private FcltWtngSec[] windowOf(String unitCd, LocalDateTime evalDt) {
		requireBoundary(evalDt);

		TreeMap<LocalDateTime, FcltWtngSec> secMap = secMapByUnit.getOrDefault(unitCd, new TreeMap<>());
		FcltWtngSec[] result = new FcltWtngSec[SEC_PER_WINDOW];
		LocalDateTime bgnDt = evalDt.minusMinutes(WINDOW_MIN);

		for (int secIndex = 0; secIndex < SEC_PER_WINDOW; secIndex++) {
			result[secIndex] = secMap.get(bgnDt.plusMinutes((long) secIndex * SEC_MIN));
		}

		return result;
	}

	private static boolean isPresent(FcltWtngSec[] window) {
		for (FcltWtngSec sec : window) {
			if (sec != null && sec.getWtngNocs() > 0) {
				return true;
			}
		}

		return false;
	}

	private static boolean isObserved(FcltWtngSec[] window) {
		for (FcltWtngSec sec : window) {
			if (sec == null || !sec.isObsrvn()) {
				return false;
			}
		}

		return true;
	}

	private static void requireBoundary(LocalDateTime dateTime) {
		if (!FcltWtngSecs.isSecBoundary(dateTime)) {
			throw new IllegalArgumentException("평가시각은 " + SEC_MIN + "분 경계여야 합니다: " + dateTime);
		}
	}

	private static int valueOf(Integer value) {
		return value == null ? 0 : value;
	}
}
