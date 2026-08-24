package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.ChknCounterDto;
import aoms.pm.cast.dto.ChknCounterIslandDto;
import aoms.pm.cast.dto.ChknCounterRsrcDto;
import aoms.pm.cast.dto.ChknCounterSearchDto;
import aoms.pm.cast.dto.ChknCounterSlotDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.MapCgnStatDto;
import aoms.pm.cast.dto.MapChknRsltDto;
import aoms.pm.cast.dto.MapNoticeDto;
import aoms.pm.cast.dto.MapNoticeItemDto;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.mapper.CastMapMapper;
import aoms.pm.cast.service.CastChknCounterService;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastUserConfigService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastChknCounterServiceImpl.java
 * @Description : 일일 시뮬레이션 결과 조회 - 체크인카운터 ServiceImpl — DB 조회
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 14. / 노세찬 / 최초작성 (구 체크인카운터 · 셀프체크인/백드롭 메뉴 통합)
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 결과는 맵형태보기 · 출국장과 같은 statement 를 쓴다 (같은 결과 테이블을 체크인 구역으로만
 * 좁힌 것이다). 하루치를 한 번 읽어 두 갈래로 편다.
 *   - 시간대별 자원(rsrcList) : 차트 보기 — 자원 운영량과 대기인원을 24시간 축에 얹는다
 *   - 30분 슬롯(slotList)     : 표 보기 — 타임라인이 가리키는 한 칸의 아일랜드별 내역
 *
 * <p>
 * 자원 구성은 <b>그날 배정정보</b>(TI_GO_CKNCT_DALY_ALOT)에서 온다. 사용자 시뮬레이션
 * 체크인 카운터 탭({@link CastChknServiceImpl})과 달리 사용자가 저장한 편집값은 보지 않는다
 * — 이 화면은 편집 대상이 아니라 수행이 끝난 결과이기 때문이다.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastChknCounterServiceImpl implements CastChknCounterService {
	/** 체크인 구역 시설 : 유인 카운터(CC) + 셀프체크인(CK) + 셀프백드롭(SBD) */
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");

	/** 보유 카운터 집계 대상 : A, B 유인 체크인카운터 */
	private static final List<String> BOOTH_USE_CRG_TYPE_CD_LIST = List.of("A", "B");

	private static final String EMPTY = "";
	private static final String USE_YN_Y = "Y";
	private static final String USE_YN_N = "N";
	private static final String ISLAND_NM_PREFIX = "아일랜드 ";

	/** 타임라인 구간 : 00:00 ~ 24:00 을 30분으로 나눈다 (새벽 출발편 때문에 이른 시각도 연다) */
	private static final int SLOT_BGN_MIN = 0;
	private static final int SLOT_END_MIN = 24 * 60;
	private static final int SLOT_STEP_MIN = 30;

	private static final int PERCENT = 100;
	private static final int MINUTE_PER_HOUR = 60;
	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 요약 바를 밀어내지 않는 상한

	private final CastChknMapper castChknMapper;
	private final CastMapMapper castMapMapper;
	private final CastSmltService castSmltService;
	private final CastSlfchknService castSlfchknService;
	private final CastUserConfigService castUserConfigService;

	@Override
	public ChknCounterDto retrieveChknCounter(ChknCounterSearchDto searchDto) {
		ChknCounterDto result = new ChknCounterDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		List<CknctCntRawDto> cknctCntList = castChknMapper.retrieveCknctCntList(fcltTmnlId, BOOTH_USE_CRG_TYPE_CD_LIST);
		List<ChknCounterIslandDto> islandList = getIslandList(fcltTmnlId, smltStng, cknctCntList);

		// 시각 → (아일랜드 → 결과)
		Map<String, Map<String, SmltRsltRawDto>> chknDayMap = retrieveUnitRsltDayMap(searchDto);
		List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(searchDto.getSmltId(), fcltTmnlId, CHKN_FCLT_CD_LIST);

		int totCnt = cknctCntList.stream().mapToInt(CknctCntRawDto::getCknctCnt).sum();
		List<ChknCounterRsrcDto> rsrcList = getRsrcList(islandList, waitList, chknDayMap, totCnt);

		SmltKpiDto kpi = castSmltService.retrieveSmltKpi(searchDto.getSmltId(), fcltTmnlId, CHKN_FCLT_CD_LIST);
		kpi.setUtilRate(getUtilRate(rsrcList, totCnt));

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setTotCnt(totCnt);
		result.setOprIslandCnt((int) islandList.stream().filter(x -> USE_YN_Y.equals(x.getUseYn())).count());
		result.setPeakCounterCnt(rsrcList.stream().mapToInt(ChknCounterRsrcDto::getCounterCnt).max().orElse(0));
		result.setTotKioskCnt(islandList.stream().mapToInt(ChknCounterIslandDto::getKioskCnt).sum());
		result.setTotBagDropCnt(islandList.stream().mapToInt(ChknCounterIslandDto::getBagDropCnt).sum());
		result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
		result.setIslandList(islandList);
		result.setRsrcList(rsrcList);
		result.setSlotList(getSlotList(islandList, chknDayMap));
		result.setKpi(kpi);

		return result;
	}

	/* ================= 결과 조회 ================= */

	// 하루치를 시각별로 나누고, 아일랜드 하나에 걸린 여러 시설(유인 · 키오스크 · 백드롭)은 한 건으로 접는다
	private Map<String, Map<String, SmltRsltRawDto>> retrieveUnitRsltDayMap(ChknCounterSearchDto searchDto) {
		List<SmltRsltRawDto> rsltList = castMapMapper.retrieveMapRsltDayList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), CHKN_FCLT_CD_LIST);

		Map<String, List<SmltRsltRawDto>> timeMap = rsltList.stream()
				.collect(Collectors.groupingBy(SmltRsltRawDto::getTime, LinkedHashMap::new, Collectors.toList()));

		Map<String, Map<String, SmltRsltRawDto>> result = new LinkedHashMap<>();

		for (Map.Entry<String, List<SmltRsltRawDto>> entry : timeMap.entrySet()) {
			result.put(entry.getKey(), foldByUnitCd(entry.getValue()));
		}

		return result;
	}

	// 대기는 가장 나쁜 값(최댓값), 처리인원은 합산 — 맵형태보기 · 출국장과 같은 규칙이다
	private Map<String, SmltRsltRawDto> foldByUnitCd(List<SmltRsltRawDto> rsltList) {
		Map<String, SmltRsltRawDto> result = new LinkedHashMap<>();

		for (SmltRsltRawDto rslt : rsltList) {
			String unitCd = rslt.getUnitCd() != null ? rslt.getUnitCd().trim() : EMPTY;

			if (unitCd.isEmpty()) {
				continue;
			}

			SmltRsltRawDto merged = result.get(unitCd);

			if (merged == null) {
				rslt.setUnitCd(unitCd);
				result.put(unitCd, rslt);
				continue;
			}

			merged.setWtngPsgCnt(Math.max(merged.getWtngPsgCnt(), rslt.getWtngPsgCnt()));
			merged.setTrnstPsgCnt(merged.getTrnstPsgCnt() + rslt.getTrnstPsgCnt());
			merged.setWtngHr(Math.max(merged.getWtngHr(), rslt.getWtngHr()));
			merged.setPrcsHr(Math.max(merged.getPrcsHr(), rslt.getPrcsHr()));
		}

		return result;
	}

	/* ================= 아일랜드 ================= */

	/*
	 * 아일랜드 목록은 보유 카운터(TN_CA_CKNCT)가 정한다 — 그날 배정이 없어도 자리는 있으므로
	 * 미운영(useYn = N)으로 함께 내려보낸다. 화면이 "G 는 오늘 안 연다"를 그려야 하기 때문이다.
	 */
	private List<ChknCounterIslandDto> getIslandList(
			String fcltTmnlId, SmltStngDto smltStng, List<CknctCntRawDto> cknctCntList) {
		Map<String, List<UserConfigChknDto>> boothMap = castUserConfigService
				.retrieveChknMapGroupByIsland(smltStng.getExcnYmd(), fcltTmnlId);
		Map<String, List<SlfDeviceCntRawDto>> slfMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
				.stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

		List<ChknCounterIslandDto> result = new ArrayList<>();

		for (CknctCntRawDto cknctCnt : cknctCntList) {
			String island = cknctCnt.getIsland();
			List<UserConfigChknDto> booths = boothMap.getOrDefault(island, new ArrayList<>());

			result.add(toIsland(cknctCnt, booths, slfMap.getOrDefault(island, new ArrayList<>())));
		}

		return result;
	}

	private ChknCounterIslandDto toIsland(
			CknctCntRawDto cknctCnt, List<UserConfigChknDto> booths, List<SlfDeviceCntRawDto> slfDevices) {
		ChknCounterIslandDto result = new ChknCounterIslandDto();
		boolean opr = !booths.isEmpty();

		result.setIsland(cknctCnt.getIsland());
		result.setFcltNm(ISLAND_NM_PREFIX + cknctCnt.getIsland());
		result.setTotCnt(cknctCnt.getCknctCnt());
		// 운영 카운터는 보유 대수가 아니라 그날 배정된 부스 수다 (사용자 시뮬레이션 탭과 같은 기준)
		result.setCounterCnt(booths.size());
		result.setKioskCnt(opr ? getDeviceCnt(slfDevices, SlfType.KIOSK) : 0);
		result.setBagDropCnt(opr ? getDeviceCnt(slfDevices, SlfType.SBD) : 0);
		result.setAlnCdList(getAlnCdList(booths));
		result.setOprTimeList(getOprTimeList(booths));
		result.setUseYn(opr ? USE_YN_Y : USE_YN_N);

		return result;
	}

	// 배정 항공사 — 부스마다 되풀이되므로 중복을 접고 코드 순으로 둔다
	private List<String> getAlnCdList(List<UserConfigChknDto> booths) {
		return new ArrayList<>(booths.stream()
				.map(UserConfigChknDto::getAlnCd)
				.filter(x -> x != null && !x.isEmpty())
				.sorted()
				.collect(Collectors.toCollection(LinkedHashSet::new)));
	}

	// 아일랜드 운영시간 = 부스별 배정 구간을 합친 것 (붙어 있는 구간은 하나로 이어진다)
	private List<OprTimeDto> getOprTimeList(List<UserConfigChknDto> booths) {
		List<TimeRange> boothRanges = booths.stream()
				.flatMap(x -> x.getTimeRanges().stream())
				.collect(toList());

		return SmltUtils.mergeTimeRanges(boothRanges).stream()
				.map(x -> new OprTimeDto().withOperBgngHour(x.getStart()).withOperEndHour(x.getEnd()))
				.collect(toList());
	}

	private int getDeviceCnt(List<SlfDeviceCntRawDto> slfDevices, SlfType slfType) {
		return slfDevices.stream().filter(x -> slfType == x.getSlfType())
				.mapToInt(SlfDeviceCntRawDto::getDeviceCnt).sum();
	}

	/* ================= 시간대별 자원 ================= */

	/*
	 * 차트 한 칸은 1시간이다. 자원은 운영시간 구간을 시간축으로 펼쳐 더하고(G7),
	 * 대기인원은 사용자 시뮬레이션 화면과 같은 조회(retrieveWaitPsgList)를 쓴다 —
	 * 같은 시설의 대기인원이 화면마다 다른 값이 되지 않도록 출처를 하나로 둔다.
	 */
	private List<ChknCounterRsrcDto> getRsrcList(
			List<ChknCounterIslandDto> islandList,
			List<WaitPsgDto> waitList,
			Map<String, Map<String, SmltRsltRawDto>> chknDayMap,
			int totCnt) {
		Map<Integer, Integer> waitMap = waitList.stream()
				.collect(Collectors.toMap(WaitPsgDto::getHour, WaitPsgDto::getWaitPsgCnt, (first, ignored) -> first));

		List<ChknCounterRsrcDto> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			List<ChknCounterIslandDto> openList = islandList.stream()
					.filter(x -> isOpr(x.getOprTimeList(), hourValue)).collect(toList());
			int counterCnt = openList.stream().mapToInt(ChknCounterIslandDto::getCounterCnt).sum();

			ChknCounterRsrcDto item = new ChknCounterRsrcDto().withHour(hourValue);
			item.setCounterCnt(counterCnt);
			item.setKioskCnt(openList.stream().mapToInt(ChknCounterIslandDto::getKioskCnt).sum());
			item.setBagDropCnt(openList.stream().mapToInt(ChknCounterIslandDto::getBagDropCnt).sum());
			item.setWtngPsgCnt(waitMap.getOrDefault(hourValue, 0));
			item.setPrcsPsgCnt(getPrcsPsgCnt(chknDayMap, hour));
			item.setUtilRate(totCnt == 0 ? 0 : counterCnt * PERCENT / totCnt);

			result.add(item);
		}

		return result;
	}

	// 한 시간에는 30분 버킷 2칸이 들어 있다. 처리인원은 흘러간 사람 수라 두 칸을 더한다
	private int getPrcsPsgCnt(Map<String, Map<String, SmltRsltRawDto>> chknDayMap, String hour) {
		int result = 0;

		for (String bucket : TimeBucketUtils.bucketList(hour)) {
			result += defaultMap(chknDayMap.get(bucket)).values().stream()
					.mapToInt(SmltRsltRawDto::getTrnstPsgCnt).sum();
		}

		return result;
	}

	private boolean isOpr(List<OprTimeDto> oprTimeList, int hour) {
		return oprTimeList.stream().anyMatch(x -> x.getOperBgngHour() <= hour && hour < x.getOperEndHour());
	}

	// 가동률 = 운영 카운터·시간 합 / (전체 카운터 수 × 24시간) — 사용자 시뮬레이션 탭과 같은 식이다
	private int getUtilRate(List<ChknCounterRsrcDto> rsrcList, int totCnt) {
		if (totCnt == 0 || rsrcList.isEmpty()) {
			return 0;
		}

		int oprCounterHour = rsrcList.stream().mapToInt(ChknCounterRsrcDto::getCounterCnt).sum();

		return oprCounterHour * PERCENT / (totCnt * rsrcList.size());
	}

	/* ================= 슬롯 ================= */

	private List<ChknCounterSlotDto> getSlotList(
			List<ChknCounterIslandDto> islandList, Map<String, Map<String, SmltRsltRawDto>> chknDayMap) {
		List<ChknCounterSlotDto> result = new ArrayList<>();

		for (String hhmm : getTimeList()) {
			List<MapChknRsltDto> chknRsltList = getChknRsltList(islandList, defaultMap(chknDayMap.get(hhmm)));

			ChknCounterSlotDto slot = new ChknCounterSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getNotice(islandList, chknRsltList));
			slot.setChknRsltList(chknRsltList);

			result.add(slot);
		}

		return result;
	}

	/**
	 * 00:00 ~ 24:00 을 30분으로 나눈 눈금 — 하단 타임라인과 같은 구간이다.
	 * 결과가 없는 구간도 자리를 비워 두지 않는다 (마지막 2400 은 하루의 끝을 닫는 눈금이라
	 * 결과 버킷(…2330)이 없어 항상 0 이다).
	 */
	private List<String> getTimeList() {
		List<String> result = new ArrayList<>();

		for (int minutes = SLOT_BGN_MIN; minutes <= SLOT_END_MIN; minutes += SLOT_STEP_MIN) {
			result.add(toHhmm(minutes));
		}

		return result;
	}

	private List<MapChknRsltDto> getChknRsltList(
			List<ChknCounterIslandDto> islandList, Map<String, SmltRsltRawDto> chknMap) {
		List<MapChknRsltDto> result = new ArrayList<>();

		for (ChknCounterIslandDto island : islandList) {
			SmltRsltRawDto rslt = chknMap.get(island.getIsland());

			MapChknRsltDto item = new MapChknRsltDto();
			item.setUnitCd(island.getIsland());
			item.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
			item.setStat(getStat(rslt));
			item.setPrcsRate(rslt != null ? getPrcsRate(rslt.getTrnstPsgCnt(), rslt.getWtngPsgCnt()) : 0);

			result.add(item);
		}

		return result;
	}

	// 이 화면의 시간 지표는 초 단위다 (대시보드 KPI 는 분이라 환산하지 않는다)
	private MapCgnStatDto getStat(SmltRsltRawDto rslt) {
		MapCgnStatDto result = new MapCgnStatDto();

		if (rslt == null) {
			return result;
		}

		result.setWtngPsgCnt(rslt.getWtngPsgCnt());
		result.setWtngHr(rslt.getWtngHr());
		result.setPrcsPsgCnt(rslt.getTrnstPsgCnt());
		result.setPrcsHr(rslt.getPrcsHr());

		return result;
	}

	private int getPrcsRate(int prcsPsgCnt, int wtngPsgCnt) {
		int total = prcsPsgCnt + wtngPsgCnt;

		return total == 0 ? 0 : prcsPsgCnt * PERCENT / total;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 아일랜드만, 혼잡한 순으로 보여준다
	private MapNoticeDto getNotice(List<ChknCounterIslandDto> islandList, List<MapChknRsltDto> chknRsltList) {
		Map<String, Integer> counterCntMap = islandList.stream()
				.collect(Collectors.toMap(ChknCounterIslandDto::getIsland, ChknCounterIslandDto::getCounterCnt,
						(first, ignored) -> first));

		List<MapNoticeItemDto> itemList = new ArrayList<>();
		int maxWtngPsgCnt = 0;

		for (MapChknRsltDto rslt : chknRsltList.stream()
				.sorted(Comparator.comparingInt((MapChknRsltDto target) -> target.getStat().getWtngPsgCnt()).reversed())
				.collect(toList())) {
			CongestionStatus cgnStatus = rslt.getCgnStatus();

			if (cgnStatus == CongestionStatus.FREE || cgnStatus == CongestionStatus.NORMAL) {
				continue;
			}

			maxWtngPsgCnt = Math.max(maxWtngPsgCnt, rslt.getStat().getWtngPsgCnt());

			if (itemList.size() < NOTICE_ITEM_LIMIT) {
				itemList.add(new MapNoticeItemDto()
						.withFcltNm(ISLAND_NM_PREFIX + rslt.getUnitCd())
						.withFcltCd(rslt.getUnitCd())
						.withBoothCnt(counterCntMap.getOrDefault(rslt.getUnitCd(), 0)));
			}
		}

		MapNoticeDto result = new MapNoticeDto();
		// 알림 단계는 가장 혼잡한 아일랜드를 따른다 (맵형태보기 · 출국장과 같은 기준)
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(maxWtngPsgCnt));
		result.setItemList(itemList);

		return result;
	}

	/* ================= 시각 ================= */

	private Map<String, SmltRsltRawDto> defaultMap(Map<String, SmltRsltRawDto> rsltMap) {
		return rsltMap != null ? rsltMap : Collections.emptyMap();
	}

	// 24:00 은 다음 날 00:00 이 아니라 마지막 눈금이라 2400 그대로 둔다
	private String toHhmm(int minutes) {
		return String.format("%02d%02d", minutes / MINUTE_PER_HOUR, minutes % MINUTE_PER_HOUR);
	}
}
