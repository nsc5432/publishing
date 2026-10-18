package aoms.pm.cast.domains.dsbd;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.ToLongFunction;

import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

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
	public static final int CAST_SLOT_MIN = 10; // CAST 결과 구간(INTERVAL) 길이(분)

	private final TerminalKind tmnlId;
	private final LocalDateTime bgnDt;
	private final LocalDateTime windowEnd;
	private final Map<String, TreeMap<LocalDateTime, DepSlot>> slotMapByUnit = new LinkedHashMap<>();
	private final Map<String, Integer> oprCntMap;

	/**
	 * @param rawList   [bgnDt - CAST_SLOT_MIN, windowEnd) 의 SC / SR 결과. 앞 한 칸은 시작 Queue 용이다
	 * @param oprCntMap 출국장별 운영 보안검색대 수 (실행 리소스 운영표)
	 */
	public DepQueueWindow(
			TerminalKind tmnlId,
			LocalDateTime bgnDt,
			LocalDateTime windowEnd,
			List<SmltRsltRawDto> rawList,
			Map<String, Integer> oprCntMap
	) {
		this.tmnlId = tmnlId;
		this.bgnDt = bgnDt;
		this.windowEnd = windowEnd;
		this.oprCntMap = new LinkedHashMap<>(oprCntMap);

		for (SmltRsltRawDto raw : rawList) {
			String unitCd = raw.getUnitCd() != null ? raw.getUnitCd().trim() : "";

			if (raw.getSmltActlDt() == null || unitCd.isEmpty()) {
				continue;
			}

			slotMapByUnit.computeIfAbsent(unitCd, ignored -> new TreeMap<>())
					.computeIfAbsent(raw.getSmltActlDt(), DepSlot::new)
					.add(raw);
		}
	}

	/** 관측구간 안에 결과가 있는 출국장 */
	public List<String> unitCdList() {
		List<String> result = new ArrayList<>();

		slotMapByUnit.forEach((unitCd, slotMap) -> {
			if (!slotMap.tailMap(bgnDt, true).isEmpty()) {
				result.add(unitCd);
			}
		});

		return result;
	}

	/** 앞 한 칸을 포함해 결과가 한 행이라도 있는지 */
	public boolean hasResult(String unitCd) {
		return slotMapByUnit.containsKey(unitCd);
	}

	/** 결과가 없어도 값이 빈 원천을 돌려준다. 배정 가능 최대 수량은 혼잡해소 팝업이 채운다 */
	public FcltQueueSource sourceOf(String unitCd) {
		TreeMap<LocalDateTime, DepSlot> slotMap = slotMapByUnit.getOrDefault(unitCd, new TreeMap<>());
		List<DepSlot> windowList = new ArrayList<>(slotMap.tailMap(bgnDt, true).values());
		DepSlot first = windowList.isEmpty() ? null : windowList.get(0);
		DepSlot last = windowList.isEmpty() ? null : windowList.get(windowList.size() - 1);
		DepSlot start = first == null ? null : slotMap.get(first.dt.minusMinutes(CAST_SLOT_MIN));
		boolean contiguous = start != null && isContiguous(windowList);

		return FcltQueueSource.builder()
				.tmnlId(tmnlId)
				.fcltType(FcltType.DEP)
				.unitCd(unitCd)
				.fcltNm(unitCd + "번 출국장")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(first == null ? bgnDt : first.dt.minusMinutes(CAST_SLOT_MIN))
				.obsEndDt(last == null ? windowEnd : last.dt)
				.queueAtStart(contiguous ? start.wtngPsgCnt : null)
				.queueAtEnd(last == null ? null : last.wtngPsgCnt)
				.wtngEndPsgCnt(contiguous ? windowList.stream().mapToInt(slot -> slot.trnstPsgCnt).sum() : null)
				.prcsPsgCnt(windowList.isEmpty() ? null : windowList.stream().mapToInt(slot -> slot.trnstPsgCnt).sum())
				.avgPrcsSec(weightedAvg(windowList, slot -> slot.prcsSecSum, slot -> slot.prcsPsgCnt))
				.avgQueuePsgCnt(windowList.isEmpty() ? null : windowList.stream().mapToInt(slot -> slot.wtngPsgCnt).average().getAsDouble())
				.avgWtngSec(weightedAvg(windowList, slot -> slot.wtngSecSum, slot -> slot.wtngWeightCnt))
				.oprCnt(oprCntMap.get(unitCd))
				.erlangCApplicable(true)
				.build();
	}

	private static boolean isContiguous(List<DepSlot> slotList) {
		for (int index = 1; index < slotList.size(); index++) {
			if (!slotList.get(index - 1).dt.plusMinutes(CAST_SLOT_MIN).equals(slotList.get(index).dt)) {
				return false;
			}
		}

		return !slotList.isEmpty();
	}

	private static Double weightedAvg(List<DepSlot> slotList, ToLongFunction<DepSlot> sum, ToLongFunction<DepSlot> weight) {
		long sumTotal = slotList.stream().mapToLong(sum).sum();
		long weightTotal = slotList.stream().mapToLong(weight).sum();

		return weightTotal > 0 ? (double) sumTotal / weightTotal : null;
	}

	/** 같은 결과 시각의 SC / SR 행을 합친 10분 결과 한 칸 */
	private static final class DepSlot {
		private final LocalDateTime dt;
		private int wtngPsgCnt;
		private int trnstPsgCnt;
		private long prcsSecSum;
		private long prcsPsgCnt;
		private long wtngSecSum;
		private long wtngWeightCnt;

		private DepSlot(LocalDateTime dt) {
			this.dt = dt;
		}

		private void add(SmltRsltRawDto raw) {
			wtngPsgCnt += raw.getWtngPsgCnt();
			trnstPsgCnt += raw.getTrnstPsgCnt();

			if (raw.getTrnstPsgCnt() > 0 && raw.getPrcsHr() > 0) {
				prcsSecSum += (long) raw.getPrcsHr() * raw.getTrnstPsgCnt();
				prcsPsgCnt += raw.getTrnstPsgCnt();
			}

			if (raw.getTrnstPsgCnt() > 0) {
				wtngSecSum += (long) raw.getWtngHr() * raw.getTrnstPsgCnt();
				wtngWeightCnt += raw.getTrnstPsgCnt();
			}
		}
	}
}
