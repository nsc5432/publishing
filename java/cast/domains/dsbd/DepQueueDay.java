package aoms.pm.cast.domains.dsbd;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableSet;
import java.util.TreeMap;
import java.util.TreeSet;

import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : DepQueueDay.java
 * @Description : 터미널 출국장 SC / SR 결과를 출국장 · 결과 시각별로 한 번 묶어 둔 원천 — 평가시각마다 DepQueueWindow 를 만든다
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
public final class DepQueueDay {
	public static final int CAST_SLOT_MIN = 10; // CAST 결과 구간(INTERVAL) 길이(분). 결과 시각은 구간 끝이다
	public static final int LOOKBACK_MIN = FcltWtngDay.DEP_LOOKBACK_MIN; // 잔여 대기열 도착 시각을 되짚는 범위(분)

	private final TerminalKind tmnlId;
	private final Map<String, TreeMap<LocalDateTime, Slot>> slotMapByUnit = new LinkedHashMap<>();
	private final NavigableSet<LocalDateTime> resultDtSet = new TreeSet<>();
	private final Map<String, Integer> oprCntMap;

	/**
	 * @param rawList   SC / SR 결과 (retrieveRsltByUnitList)
	 * @param oprCntMap 출국장별 운영 보안검색대 수 (실행 리소스 운영표)
	 */
	public DepQueueDay(TerminalKind tmnlId, List<SmltRsltRawDto> rawList, Map<String, Integer> oprCntMap) {
		this.tmnlId = tmnlId;
		this.oprCntMap = new LinkedHashMap<>(oprCntMap);

		for (SmltRsltRawDto raw : rawList) {
			String unitCd = raw.getUnitCd() != null ? raw.getUnitCd().trim() : "";

			if (raw.getSmltActlDt() == null) {
				continue;
			}

			resultDtSet.add(raw.getSmltActlDt());

			if (unitCd.isEmpty()) {
				continue;
			}

			slotMapByUnit.computeIfAbsent(unitCd, ignored -> new TreeMap<>())
					.computeIfAbsent(raw.getSmltActlDt(), Slot::new)
					.add(raw);
		}
	}

	/** 결과가 한 행이라도 있는 출국장 */
	public List<String> unitCdList() {
		return new ArrayList<>(slotMapByUnit.keySet());
	}

	/** 실행 리소스 운영표에 있는 출국장 */
	public List<String> oprUnitCdList() {
		return new ArrayList<>(oprCntMap.keySet());
	}

	/** 터미널 첫 결과 시각. 결과가 없으면 null */
	public LocalDateTime firstResultDt() {
		return resultDtSet.isEmpty() ? null : resultDtSet.first();
	}

	NavigableSet<LocalDateTime> getResultDtSet() {
		return resultDtSet;
	}

	TerminalKind getTmnlId() {
		return tmnlId;
	}

	Integer oprCntOf(String unitCd) {
		return oprCntMap.get(unitCd);
	}

	Map<String, TreeMap<LocalDateTime, Slot>> getSlotMapByUnit() {
		return slotMapByUnit;
	}

	boolean hasResultAt(LocalDateTime dt) {
		return resultDtSet.contains(dt);
	}

	/** 같은 결과 시각의 SC / SR 행을 합친 10분 결과 한 칸 */
	static final class Slot {
		final LocalDateTime dt;
		int wtngPsgCnt;
		int trnstPsgCnt;
		long prcsSecSum;
		long prcsPsgCnt;
		double wtngSecSum;
		int wtngNullPsgCnt;

		private Slot(LocalDateTime dt) {
			this.dt = dt;
		}

		private void add(SmltRsltRawDto raw) {
			wtngPsgCnt += raw.getWtngPsgCnt();
			trnstPsgCnt += raw.getTrnstPsgCnt();
			// 같은 출국장 안 레인별 평균을 MAX 로 접기 전에 처리인원 가중합으로 받는다
			wtngSecSum += raw.getWtngSecSum();
			wtngNullPsgCnt += raw.getWtngNullPsgCnt();

			if (raw.getTrnstPsgCnt() > 0 && raw.getPrcsHr() > 0) {
				prcsSecSum += (long) raw.getPrcsHr() * raw.getTrnstPsgCnt();
				prcsPsgCnt += raw.getTrnstPsgCnt();
			}
		}
	}
}
