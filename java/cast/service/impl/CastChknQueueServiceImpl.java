package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.chkn.ChknQueueCalculator;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueInterval;
import aoms.pm.cast.domains.chkn.ChknQueueSeries;
import aoms.pm.cast.domains.chkn.ChknQueueTrajectory;
import aoms.pm.cast.dto.ChknBoothOperRawDto;
import aoms.pm.cast.dto.ChknQueueRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastChknQueueService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @Classname : CastChknQueueServiceImpl.java
 * @Description : 체크인 아일랜드 공용 Queue ServiceImpl
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
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastChknQueueServiceImpl implements CastChknQueueService {
	private static final String YMD_FORMAT = "yyyyMMdd";
	private static final int MINUTE_PER_DAY = ChknQueueSeries.MINUTE_PER_DAY;

	private final CastChknMapper castChknMapper;

	@Override
	public ChknQueueDay retrieveChknQueueDay(SmltStngDto smltStng, TerminalKind tmnlId) {
		return new ChknQueueDay(calculate(smltStng, tmnlId, null));
	}

	@Override
	public ChknQueueTrajectory calculateChknQueue(SmltStngDto smltStng, TerminalKind tmnlId) {
		return calculate(smltStng, tmnlId, smltStng.getSmltMdlSn());
	}

	private ChknQueueTrajectory calculate(SmltStngDto smltStng, TerminalKind tmnlId, Integer smltMdlSn) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String context = "smltId=" + smltStng.getSmltId() + ", smltMdlSn=" + smltMdlSn + ", tmnlId=" + tmnlId.getValue();
		LocalDate baseDate = LocalDate.parse(smltStng.getExcnYmd(), DateTimeFormatter.ofPattern(YMD_FORMAT));

		List<ChknQueueRawDto> rawList = castChknMapper.retrieveChknQueueRawList(smltStng.getSmltId(), fcltTmnlId, "CC", smltMdlSn);
		Map<String, int[]> assignedBoothCntByIsland = retrieveAssignedBoothCnt(smltStng, fcltTmnlId, baseDate);
		Map<String, Map<Integer, List<ChknQueueRawDto>>> rawListByIslandAndMinute = groupByIslandAndMinute(rawList, baseDate);
		BigDecimal tmnlAvgPrcsSec = weightedPrcsSec(rawList);
		TreeSet<Integer> resultMinuteSet = toResultMinuteSet(rawListByIslandAndMinute);
		int originMinute = resultMinuteSet.isEmpty() ? 0 : CastChknQueueService.originMinuteOf(resultMinuteSet.first());
		Map<String, ChknQueueSeries> seriesByIsland = new LinkedHashMap<>();

		for (String island : CHKN_ISLAND_CD_LIST) {
			seriesByIsland.put(island, ChknQueueCalculator.calculate(
                island,
                toIntervalList(rawListByIslandAndMinute.getOrDefault(island, Map.of())),
                assignedBoothCntByIsland.get(island),
                tmnlAvgPrcsSec,
                originMinute
            ));
		}

		ChknQueueTrajectory result = new ChknQueueTrajectory(
                tmnlId,
                baseDate,
                originMinute,
                toCovered(resultMinuteSet, originMinute),
                seriesByIsland
        );

		for (String warning : result.warningList()) {
			log.warn("체크인 공용 Queue 계산 보정: {}, {}", context, warning);
		}

		return result;
	}

	private Map<String, Map<Integer, List<ChknQueueRawDto>>> groupByIslandAndMinute(
        List<ChknQueueRawDto> rawList, LocalDate baseDate
    ) {
		Map<String, Map<Integer, List<ChknQueueRawDto>>> result = new LinkedHashMap<>();

		for (ChknQueueRawDto raw : rawList) {
			String island = raw.getIsland() != null ? raw.getIsland().trim() : "";

			if (island.isEmpty() || raw.getSmltActlDt() == null) {
				continue;
			}

			int minute = Math.toIntExact(Duration.between(baseDate.atStartOfDay(), raw.getSmltActlDt()).toMinutes());

			result
                .computeIfAbsent(island, ignored -> new TreeMap<>())
                .computeIfAbsent(minute, ignored -> new ArrayList<>())
                .add(raw);
		}

		return result;
	}

	private TreeSet<Integer> toResultMinuteSet(Map<String, Map<Integer, List<ChknQueueRawDto>>> rawListByIslandAndMinute) {
		TreeSet<Integer> result = new TreeSet<>();

		rawListByIslandAndMinute.values().forEach(rawListByMinute -> result.addAll(rawListByMinute.keySet()));

		return result;
	}

	/*
	 * 결과 시각 m 은 구간 끝이라 [m - 결과 간격, m) 을 덮는다. 결과 간격은 터미널 CC 결과 시각의 최소 간격이며,
	 * 그보다 벌어진 시각 사이와 마지막 결과 뒤(꼬리 구간)는 관측하지 않은 구간으로 둔다.
	 */
	private boolean[] toCovered(TreeSet<Integer> resultMinuteSet, int originMinute) {
		boolean[] result = new boolean[MINUTE_PER_DAY - originMinute];
		int stepMin = Integer.MAX_VALUE;
		Integer previous = null;

		for (int minute : resultMinuteSet) {
			if (previous != null) {
				stepMin = Math.min(stepMin, minute - previous);
			}

			previous = minute;
		}

		if (stepMin == Integer.MAX_VALUE) {
			stepMin = CAST_SLOT_MIN;
		}

		for (int minute : resultMinuteSet) {
			for (int covered = Math.max(minute - stepMin, originMinute); covered < Math.min(minute, MINUTE_PER_DAY); covered++) {
				result[covered - originMinute] = true;
			}
		}

		return result;
	}

	private List<ChknQueueInterval> toIntervalList(Map<Integer, List<ChknQueueRawDto>> rawListByMinute) {
		List<Integer> minuteList = new ArrayList<>(rawListByMinute.keySet());
		List<ChknQueueInterval> result = new ArrayList<>();

		for (int index = 0; index < minuteList.size(); index++) {
			int endMinute = minuteList.get(index);
			int bgnMinute = index == 0 ? endMinute - CAST_SLOT_MIN : minuteList.get(index - 1);
			List<ChknQueueRawDto> boothList = rawListByMinute.get(endMinute);

			result.add(new ChknQueueInterval(
                bgnMinute,
                endMinute - bgnMinute,
                boothList.stream().mapToInt(ChknQueueRawDto::getWtngPsgCnt).sum(),
                boothList.stream().mapToInt(ChknQueueRawDto::getTrnstPsgCnt).sum(),
                weightedPrcsSec(boothList),
                (int) boothList.stream().filter(raw -> raw.getWtngPsgCnt() > 0 || raw.getTrnstPsgCnt() > 0).count()
            ));
		}

		addTailInterval(result);

		return result;
	}

	// 꼬리 구간을 비우면 마지막 Queue가 미운영 시각까지 남는다.
	private void addTailInterval(List<ChknQueueInterval> intervalList) {
		if (intervalList.isEmpty()) {
			return;
		}

		ChknQueueInterval last = intervalList.get(intervalList.size() - 1);
		int bgnMinute = last.getBgnMinute() + last.getDurationMin();

		if (bgnMinute >= MINUTE_PER_DAY) {
			return;
		}

		intervalList.add(ChknQueueInterval.tail(bgnMinute, MINUTE_PER_DAY - bgnMinute, last.getWtngEndPsgCnt()));
	}

	// 가중/단순 평균 처리시간
	private BigDecimal weightedPrcsSec(List<ChknQueueRawDto> rawList) {
		int simplePrcsSecSum = 0;
		int simplePrcsCnt = 0;
		long weightedPrcsSecSum = 0;
		int weightedPsgCnt = 0;

		for (ChknQueueRawDto raw : rawList) {
			if (raw.getPrcsHr() <= 0) {
				continue;
			}

			simplePrcsSecSum += raw.getPrcsHr();
			simplePrcsCnt++;

			if (raw.getTrnstPsgCnt() > 0) {
				weightedPrcsSecSum += (long) raw.getPrcsHr() * raw.getTrnstPsgCnt();
				weightedPsgCnt += raw.getTrnstPsgCnt();
			}
		}

		// 가중평균
		if (weightedPsgCnt > 0) {
			return BigDecimal.valueOf(weightedPrcsSecSum).divide(BigDecimal.valueOf(weightedPsgCnt), MathContext.DECIMAL128);
		}

		// 안되면 단순평균
		if (simplePrcsCnt > 0) {
			return BigDecimal.valueOf(simplePrcsSecSum).divide(BigDecimal.valueOf(simplePrcsCnt), MathContext.DECIMAL128);
		}

		return null;
	}

	/*
	 * 배정 부스 수는 실행 STNG 의 CA 리소스(CA001 운영자료 / 사용자 CA)에서 분 단위로 센다.
	 * 같은 부스의 겹치는 운영 구간은 한 대로 센다.
	 */
	private Map<String, int[]> retrieveAssignedBoothCnt(SmltStngDto smltStng, String fcltTmnlId, LocalDate baseDate) {
		String resourceId = smltStng.getCknctAlctnRsrcId();

		if (resourceId == null || resourceId.isEmpty()) {
			throw new IllegalStateException("실행 리소스 정보를 찾을 수 없습니다. smltId=" + smltStng.getSmltId() + ", column=CKNCT_ALCTN_RSRC_ID");
		}

		Map<String, Map<String, boolean[]>> boothMinuteByIsland = new LinkedHashMap<>();

		for (ChknBoothOperRawDto raw : castChknMapper.retrieveChknBoothOperList(smltStng.getExcnYmd(), fcltTmnlId, resourceId)) {
			String island = raw.getIsland() != null ? raw.getIsland().trim() : "";

			if (island.isEmpty() || raw.getCknctId() == null || raw.getBgnDt() == null || raw.getEndDt() == null) {
				continue;
			}

			int bgn = Math.max(minuteOf(baseDate, raw.getBgnDt()), 0);
			int end = Math.min(minuteOf(baseDate, raw.getEndDt()), MINUTE_PER_DAY);
			boolean[] boothMinute = boothMinuteByIsland
					.computeIfAbsent(island, ignored -> new LinkedHashMap<>())
					.computeIfAbsent(raw.getCknctId(), ignored -> new boolean[MINUTE_PER_DAY]);

			for (int minute = bgn; minute < end; minute++) {
				boothMinute[minute] = true;
			}
		}

		Map<String, int[]> result = new LinkedHashMap<>();

		for (String island : CHKN_ISLAND_CD_LIST) {
			int[] boothCnt = new int[MINUTE_PER_DAY];

			for (boolean[] boothMinute : boothMinuteByIsland.getOrDefault(island, Map.of()).values()) {
				for (int minute = 0; minute < MINUTE_PER_DAY; minute++) {
					boothCnt[minute] += boothMinute[minute] ? 1 : 0;
				}
			}

			result.put(island, boothCnt);
		}

		return result;
	}

	private int minuteOf(LocalDate baseDate, LocalDateTime dateTime) {
		long minute = Duration.between(baseDate.atStartOfDay(), dateTime).toMinutes();

		return (int) Math.max(Math.min(minute, MINUTE_PER_DAY), -MINUTE_PER_DAY);
	}
}
