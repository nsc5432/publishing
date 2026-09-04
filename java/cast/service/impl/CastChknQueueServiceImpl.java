package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.chkn.ChknQueueCalculator;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueInterval;
import aoms.pm.cast.domains.chkn.ChknQueueSeries;
import aoms.pm.cast.dto.ChknQueueRawDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastCgnGradeService;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastUserConfigService;

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
	/** Queue 대상은 유인 카운터뿐이다 — 셀프체크인(CK) · 셀프백드롭(SBD)은 자원 정보로만 남는다 */
	private static final String QUEUE_UP_PSG_FCLT_CD = "CC";

	private static final String YMD_FORMAT = "yyyyMMdd";
	private static final int MINUTE_PER_DAY = ChknQueueSeries.MINUTE_PER_DAY;
	private static final int MINUTE_PER_HOUR = 60;
	private static final int DEFAULT_ITVL_MIN = 10;
	private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;

	private final CastChknMapper castChknMapper;
	private final CastUserConfigService castUserConfigService;
	private final CastCgnGradeService castCgnGradeService;

	@Override
	public ChknQueueDay retrieveChknQueueDay(String smltId, TerminalKind tmnlId, String excnYmd) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String context = "smltId=" + smltId + ", tmnlId=" + tmnlId.getValue();

		List<ChknQueueRawDto> rawList =
				castChknMapper.retrieveChknQueueRawList(smltId, fcltTmnlId, QUEUE_UP_PSG_FCLT_CD);
		Map<String, List<UserConfigChknDto>> boothMap =
				castUserConfigService.retrieveChknMapGroupByIsland(excnYmd, fcltTmnlId);

		LocalDate baseDate = LocalDate.parse(excnYmd, DateTimeFormatter.ofPattern(YMD_FORMAT));
		Map<String, Map<Integer, List<ChknQueueRawDto>>> islandRawMap = groupByIslandAndMinute(rawList, baseDate);
		BigDecimal tmnlAvgPrcsSec = weightedPrcsSec(rawList);

		Map<String, ChknQueueSeries> seriesMap = new LinkedHashMap<>();

		for (String island : islandCdList(boothMap, islandRawMap)) {
			seriesMap.put(island, ChknQueueCalculator.calculate(
					island,
					toIntervalList(islandRawMap.getOrDefault(island, Map.of())),
					toAssignedBoothCnt(boothMap.get(island)),
					tmnlAvgPrcsSec));
		}

		ChknQueueDay result = new ChknQueueDay(seriesMap, castCgnGradeService.retrieveGradeScale(FcltType.CHKN, context));

		for (String warning : result.warningList()) {
			log.warn("체크인 공용 Queue 계산 보정: {}, {}", context, warning);
		}

		return result;
	}

	private List<String> islandCdList(
			Map<String, List<UserConfigChknDto>> boothMap,
			Map<String, Map<Integer, List<ChknQueueRawDto>>> islandRawMap) {
		Set<String> result = new LinkedHashSet<>(boothMap.keySet());
		result.addAll(islandRawMap.keySet());

		return new ArrayList<>(result);
	}

	private Map<String, Map<Integer, List<ChknQueueRawDto>>> groupByIslandAndMinute(
			List<ChknQueueRawDto> rawList, LocalDate baseDate) {
		Map<String, Map<Integer, List<ChknQueueRawDto>>> result = new LinkedHashMap<>();

		for (ChknQueueRawDto raw : rawList) {
			String island = raw.getIsland() != null ? raw.getIsland().trim() : "";

			if (island.isEmpty() || raw.getSmltActlDt() == null) {
				continue;
			}

			int minute = Math.toIntExact(
					Duration.between(baseDate.atStartOfDay(), raw.getSmltActlDt()).toMinutes());

			result.computeIfAbsent(island, ignored -> new TreeMap<>())
					.computeIfAbsent(minute, ignored -> new ArrayList<>())
					.add(raw);
		}

		return result;
	}

	private List<ChknQueueInterval> toIntervalList(Map<Integer, List<ChknQueueRawDto>> minuteMap) {
		List<Integer> minuteList = new ArrayList<>(minuteMap.keySet());
		List<ChknQueueInterval> result = new ArrayList<>();

		for (int index = 0; index < minuteList.size(); index++) {
			int bgnMinute = minuteList.get(index);
			int durationMin = index + 1 < minuteList.size()
					? minuteList.get(index + 1) - bgnMinute
					: lastDurationMin(minuteList);
			List<ChknQueueRawDto> boothList = minuteMap.get(bgnMinute);

			result.add(new ChknQueueInterval(
					bgnMinute,
					durationMin,
					boothList.stream().mapToInt(ChknQueueRawDto::getWtngPsgCnt).sum(),
					boothList.stream().mapToInt(ChknQueueRawDto::getTrnstPsgCnt).sum(),
					weightedPrcsSec(boothList),
					(int) boothList.stream()
							.filter(raw -> raw.getWtngPsgCnt() > 0 || raw.getTrnstPsgCnt() > 0)
							.count()));
		}

		addTailInterval(result);

		return result;
	}

	/*
	 * 마지막 결과 시각 이후는 유입이 없다고 보고 남은 Queue 를 배정 부스로 흘려보낸다.
	 * 이 구간을 비우면 마지막 Queue 가 24:00 까지 그대로 남아 미운영 시각에 대기인원이 서 있게 된다.
	 */
	private void addTailInterval(List<ChknQueueInterval> intervalList) {
		if (intervalList.isEmpty()) {
			return;
		}

		ChknQueueInterval last = intervalList.get(intervalList.size() - 1);
		int bgnMinute = last.getBgnMinute() + last.getDurationMin();

		if (bgnMinute >= MINUTE_PER_DAY) {
			return;
		}

		intervalList.add(new ChknQueueInterval(
				bgnMinute,
				MINUTE_PER_DAY - bgnMinute,
				last.getObservedQueue(),
				0,
				null,
				0));
	}

	private int lastDurationMin(List<Integer> minuteList) {
		if (minuteList.size() < 2) {
			return DEFAULT_ITVL_MIN;
		}

		return minuteList.get(minuteList.size() - 1) - minuteList.get(minuteList.size() - 2);
	}

	/** 처리인원 가중 평균 처리시간 — 처리 실적이 없으면 양수 처리시간의 단순 평균으로 떨어진다 */
	private BigDecimal weightedPrcsSec(List<ChknQueueRawDto> rawList) {
		BigDecimal weightedSum = BigDecimal.ZERO;
		int processedSum = 0;
		int prcsSecSum = 0;
		int prcsSecCnt = 0;

		for (ChknQueueRawDto raw : rawList) {
			if (raw.getPrcsHr() <= 0) {
				continue;
			}

			prcsSecSum += raw.getPrcsHr();
			prcsSecCnt++;

			if (raw.getTrnstPsgCnt() > 0) {
				weightedSum = weightedSum.add(
						BigDecimal.valueOf((long) raw.getPrcsHr() * raw.getTrnstPsgCnt()), MATH_CONTEXT);
				processedSum += raw.getTrnstPsgCnt();
			}
		}

		if (processedSum > 0) {
			return weightedSum.divide(BigDecimal.valueOf(processedSum), MATH_CONTEXT);
		}

		if (prcsSecCnt > 0) {
			return BigDecimal.valueOf(prcsSecSum).divide(BigDecimal.valueOf(prcsSecCnt), MATH_CONTEXT);
		}

		return null;
	}

	private int[] toAssignedBoothCnt(List<UserConfigChknDto> boothList) {
		int[] result = new int[MINUTE_PER_DAY];

		if (boothList == null) {
			return result;
		}

		for (UserConfigChknDto booth : boothList) {
			for (TimeRange range : booth.getTimeRanges()) {
				int bgn = Math.max(range.getStart() * MINUTE_PER_HOUR, 0);
				int end = Math.min(range.getEnd() * MINUTE_PER_HOUR, MINUTE_PER_DAY);

				for (int minute = bgn; minute < end; minute++) {
					result[minute]++;
				}
			}
		}

		return result;
	}
}
