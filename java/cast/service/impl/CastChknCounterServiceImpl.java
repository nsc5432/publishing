package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueKpi;
import aoms.pm.cast.domains.chkn.ChknQueueRecommend;
import aoms.pm.cast.domains.chkn.ChknQueueSlot;
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
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastChknCounterService;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastUserConfigService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastChknCounterServiceImpl.java
 * @Description : 일일 시뮬레이션 결과 조회 - 체크인카운터 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 14. / 노세찬 / 최초작성
 * 2026. 09. 04. / 노세찬 / 아일랜드 공용 Queue 결과로 교체
 * -----------------------------------------------------------------------------------
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastChknCounterServiceImpl implements CastChknCounterService {
	/** 보유 카운터 집계 대상 : A, B 유인 체크인카운터 */
	private static final List<String> BOOTH_USE_CRG_TYPE_CD_LIST = List.of("A", "B");

	private static final String USE_YN_Y = "Y";
	private static final String USE_YN_N = "N";
	private static final String ISLAND_NM_PREFIX = "아일랜드 ";

	/** 타임라인 시작 시각 — 새벽 출발편 때문에 이른 시각도 연다 */
	private static final int SLOT_BGN_HOUR = 0;

	private static final int SLOT_MIN = 30;
	private static final int MINUTE_PER_HOUR = 60;
	private static final int HHMM_LENGTH = 4;
	private static final int PERCENT = 100;
	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 요약 바를 밀어내지 않는 상한

	private final CastChknMapper castChknMapper;
	private final CastChknQueueService castChknQueueService;
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
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(
				searchDto.getSmltId(), tmnlId, smltStng.getExcnYmd());

		int totCnt = cknctCntList.stream().mapToInt(CknctCntRawDto::getCknctCnt).sum();
		List<ChknCounterRsrcDto> rsrcList = getRsrcList(islandList, queueDay, totCnt);
		ChknQueueKpi queueKpi = queueDay.tmnlSeries().kpi();

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setTotCnt(totCnt);
		result.setOprIslandCnt((int) islandList.stream()
				.filter(island -> USE_YN_Y.equals(island.getUseYn()))
				.count());
		result.setPeakCounterCnt(rsrcList.stream().mapToInt(ChknCounterRsrcDto::getCounterCnt).max().orElse(0));
		result.setTotKioskCnt(islandList.stream().mapToInt(ChknCounterIslandDto::getKioskCnt).sum());
		result.setTotBagDropCnt(islandList.stream().mapToInt(ChknCounterIslandDto::getBagDropCnt).sum());
		result.setWaitMaxCnt(queueKpi.getMaxQueuePsgCnt());
		result.setIslandList(islandList);
		result.setRsrcList(rsrcList);
		result.setSlotList(getSlotList(islandList, queueDay));
		result.setKpi(getKpi(queueKpi));

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
		Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
				.stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

		List<ChknCounterIslandDto> result = new ArrayList<>();

		for (CknctCntRawDto cknctCnt : cknctCntList) {
			String islandCd = cknctCnt.getIsland();

			result.add(toIsland(
					cknctCnt,
					boothMap.getOrDefault(islandCd, new ArrayList<>()),
					slfDeviceMap.getOrDefault(islandCd, new ArrayList<>())));
		}

		return result;
	}

	private ChknCounterIslandDto toIsland(
			CknctCntRawDto cknctCnt, List<UserConfigChknDto> boothList, List<SlfDeviceCntRawDto> slfDeviceList) {
		ChknCounterIslandDto result = new ChknCounterIslandDto();
		boolean opr = !boothList.isEmpty();

		result.setIsland(cknctCnt.getIsland());
		result.setFcltNm(ISLAND_NM_PREFIX + cknctCnt.getIsland());
		result.setTotCnt(cknctCnt.getCknctCnt());
		// 운영 카운터는 보유 대수가 아니라 그날 배정된 부스 수다 (사용자 시뮬레이션 탭과 같은 기준)
		result.setCounterCnt(boothList.size());
		result.setKioskCnt(opr ? getDeviceCnt(slfDeviceList, SlfType.KIOSK) : 0);
		result.setBagDropCnt(opr ? getDeviceCnt(slfDeviceList, SlfType.SBD) : 0);
		result.setAlnCdList(getAlnCdList(boothList));
		result.setOprTimeList(getOprTimeList(boothList));
		result.setUseYn(opr ? USE_YN_Y : USE_YN_N);

		return result;
	}

	// 배정 항공사 — 부스마다 되풀이되므로 중복을 접고 코드 순으로 둔다
	private List<String> getAlnCdList(List<UserConfigChknDto> boothList) {
		return new ArrayList<>(boothList.stream()
				.map(UserConfigChknDto::getAlnCd)
				.filter(alnCd -> alnCd != null && !alnCd.isEmpty())
				.sorted()
				.collect(Collectors.toCollection(LinkedHashSet::new)));
	}

	// 아일랜드 운영시간 = 부스별 배정 구간을 합친 것 (붙어 있는 구간은 하나로 이어진다)
	private List<OprTimeDto> getOprTimeList(List<UserConfigChknDto> boothList) {
		List<TimeRange> boothTimeRangeList = boothList.stream()
				.flatMap(booth -> booth.getTimeRanges().stream())
				.collect(toList());

		return SmltUtils.mergeTimeRanges(boothTimeRangeList).stream()
				.map(range -> new OprTimeDto().withOperBgngHour(range.getStart()).withOperEndHour(range.getEnd()))
				.collect(toList());
	}

	private int getDeviceCnt(List<SlfDeviceCntRawDto> slfDeviceList, SlfType slfType) {
		return slfDeviceList.stream()
				.filter(device -> slfType == device.getSlfType())
				.mapToInt(SlfDeviceCntRawDto::getDeviceCnt)
				.sum();
	}

	/* ================= 시간대별 자원 ================= */

	/*
	 * 차트 한 칸은 1시간이다. 자원은 운영시간 구간을 시간축으로 펼쳐 더하고, 대기인원은 순간 재고량이라
	 * 두 30분 슬롯을 합산하지 않고 매시 마지막 Queue 를 쓴다.
	 */
	private List<ChknCounterRsrcDto> getRsrcList(
			List<ChknCounterIslandDto> islandList, ChknQueueDay queueDay, int totCnt) {
		List<ChknCounterRsrcDto> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			ChknQueueSlot hourSlot = queueDay.tmnlSeries().slotOf(hourValue * MINUTE_PER_HOUR, MINUTE_PER_HOUR);
			List<ChknCounterIslandDto> oprIslandList = islandList.stream()
					.filter(island -> isOpr(island.getOprTimeList(), hourValue))
					.collect(toList());
			int counterCnt = oprIslandList.stream().mapToInt(ChknCounterIslandDto::getCounterCnt).sum();

			ChknCounterRsrcDto rsrc = new ChknCounterRsrcDto().withHour(hourValue);
			rsrc.setCounterCnt(counterCnt);
			rsrc.setKioskCnt(oprIslandList.stream().mapToInt(ChknCounterIslandDto::getKioskCnt).sum());
			rsrc.setBagDropCnt(oprIslandList.stream().mapToInt(ChknCounterIslandDto::getBagDropCnt).sum());
			rsrc.setWtngPsgCnt(hourSlot.getCurrentQueue());
			rsrc.setPrcsPsgCnt(hourSlot.getPrcsPsgCnt());
			rsrc.setUtilRate(totCnt == 0 ? 0 : counterCnt * PERCENT / totCnt);

			result.add(rsrc);
		}

		return result;
	}

	private boolean isOpr(List<OprTimeDto> oprTimeList, int hour) {
		return oprTimeList.stream()
				.anyMatch(oprTime -> oprTime.getOperBgngHour() <= hour && hour < oprTime.getOperEndHour());
	}

	/* ================= 결과 지표 ================= */

	private SmltKpiDto getKpi(ChknQueueKpi queueKpi) {
		SmltKpiDto result = new SmltKpiDto();

		result.setAvgWaitMin(queueKpi.getAvgWaitMin());
		result.setP95WaitMin(queueKpi.getP95WaitMin());
		result.setMaxQueuePsgCnt(queueKpi.getMaxQueuePsgCnt());
		result.setUtilRate(queueKpi.getUtilRate());

		return result;
	}

	/* ================= 슬롯 ================= */

	private List<ChknCounterSlotDto> getSlotList(List<ChknCounterIslandDto> islandList, ChknQueueDay queueDay) {
		List<ChknCounterSlotDto> result = new ArrayList<>();

		for (String hhmm : TimeBucketUtils.slotTimeList(SLOT_BGN_HOUR)) {
			List<MapChknRsltDto> chknRsltList = getChknRsltList(islandList, queueDay, toMinute(hhmm));

			ChknCounterSlotDto slot = new ChknCounterSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getNotice(chknRsltList));
			slot.setChknRsltList(chknRsltList);

			result.add(slot);
		}

		return result;
	}

	private List<MapChknRsltDto> getChknRsltList(
			List<ChknCounterIslandDto> islandList, ChknQueueDay queueDay, int bgnMinute) {
		List<MapChknRsltDto> result = new ArrayList<>();

		for (ChknCounterIslandDto island : islandList) {
			result.add(toChknRslt(island.getIsland(), queueDay, bgnMinute));
		}

		return result;
	}

	private MapChknRsltDto toChknRslt(String islandCd, ChknQueueDay queueDay, int bgnMinute) {
		ChknQueueSlot queueSlot = queueDay.slotOf(islandCd, bgnMinute, SLOT_MIN);
		ChknQueueRecommend recommend = queueDay.recommendOf(islandCd, bgnMinute, SLOT_MIN);

		MapCgnStatDto stat = new MapCgnStatDto();
		stat.setWtngPsgCnt(queueSlot.getCurrentQueue());
		stat.setWtngHr(queueSlot.getAvgWaitSec());
		stat.setPrcsPsgCnt(queueSlot.getPrcsPsgCnt());
		stat.setPrcsHr(queueSlot.getAvgPrcsSec());

		MapChknRsltDto result = new MapChknRsltDto();
		result.setUnitCd(islandCd);
		result.setCgnStatus(queueDay.statusOf(queueSlot.getCurrentQueue(), "island=" + islandCd));
		result.setStat(stat);
		result.setPrcsRate(queueSlot.getPrcsRate());
		result.setAvgQueuePsgCnt(queueSlot.getAvgQueue());
		result.setMaxQueuePsgCnt(queueSlot.getMaxQueue());
		result.setOprBoothCnt(queueSlot.getOprBoothCnt());
		result.setReqCnt(recommend.getReqCnt());
		result.setCgnClearMin(recommend.getCgnClearMin());

		return result;
	}

	private int toMinute(String hhmm) {
		return Integer.parseInt(hhmm.substring(0, 2)) * MINUTE_PER_HOUR
				+ Integer.parseInt(hhmm.substring(2, HHMM_LENGTH));
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 아일랜드만, Queue 가 긴 순으로 보여준다
	private MapNoticeDto getNotice(List<MapChknRsltDto> chknRsltList) {
		List<MapChknRsltDto> sortedList = chknRsltList.stream()
				.sorted(Comparator.comparingInt((MapChknRsltDto target) -> target.getStat().getWtngPsgCnt()).reversed())
				.collect(toList());
		List<MapNoticeItemDto> itemList = new ArrayList<>();

		for (MapChknRsltDto rslt : sortedList) {
			CongestionStatus cgnStatus = rslt.getCgnStatus();

			if (cgnStatus == CongestionStatus.FREE || cgnStatus == CongestionStatus.NORMAL) {
				continue;
			}

			if (itemList.size() >= NOTICE_ITEM_LIMIT) {
				break;
			}

			itemList.add(new MapNoticeItemDto()
					.withFcltNm(ISLAND_NM_PREFIX + rslt.getUnitCd())
					.withFcltCd(rslt.getUnitCd())
					.withBoothCnt(rslt.getOprBoothCnt())
					.withReqCnt(rslt.getReqCnt())
					.withCgnClearMin(rslt.getCgnClearMin()));
		}

		MapNoticeDto result = new MapNoticeDto();
		// 알림 단계는 Queue 가 가장 긴 아일랜드를 따른다 (맵형태보기 · 출국장과 같은 기준)
		result.setCgnStatus(sortedList.isEmpty() ? CongestionStatus.FREE : sortedList.get(0).getCgnStatus());
		result.setItemList(itemList);

		return result;
	}

}
