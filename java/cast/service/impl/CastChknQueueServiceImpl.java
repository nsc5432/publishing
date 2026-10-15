package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.math.MathContext;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.chkn.ChknQueueCalculator;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueInterval;
import aoms.pm.cast.domains.chkn.ChknQueueSeries;
import aoms.pm.cast.domains.chkn.ChknSbdDay;
import aoms.pm.cast.dto.ChknQueueRawDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastCgnGradeService;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastChknService;

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
	private static final int MINUTE_PER_HOUR = 60;
	private static final int DEFAULT_INTRVL_MIN = 10;

	private final CastChknMapper castChknMapper;
	private final CastChknService castChknService;
	private final CastCgnGradeService castCgnGradeService;

	@Override
	public ChknQueueDay retrieveChknQueueDay(String smltId, TerminalKind tmnlId, String excnYmd) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String context = "smltId=" + smltId + ", tmnlId=" + tmnlId.getValue();

		List<ChknQueueRawDto> rawList = castChknMapper.retrieveChknQueueRawList(smltId, fcltTmnlId, "CC");
		Map<String, List<UserConfigChknDto>> boothListByIsland = castChknService.retrieveChknMapGroupByIsland(excnYmd, fcltTmnlId);

		LocalDate baseDate = LocalDate.parse(excnYmd, DateTimeFormatter.ofPattern(YMD_FORMAT));
		Map<String, Map<Integer, List<ChknQueueRawDto>>> rawListByIslandAndMinute = groupByIslandAndMinute(rawList, baseDate);
		BigDecimal tmnlAvgPrcsSec = weightedPrcsSec(rawList);

		Map<String, ChknQueueSeries> seriesByIsland = new LinkedHashMap<>();

		for (String island : boothListByIsland.keySet()) {
			seriesByIsland.put(island, ChknQueueCalculator.calculate(
                island, 
                toIntervalList(rawListByIslandAndMinute.getOrDefault(island, Map.of())), 
                toAssignedBoothCnt(boothListByIsland.get(island)), 
                tmnlAvgPrcsSec
            ));
		}

		ChknQueueDay result = new ChknQueueDay(seriesByIsland, castCgnGradeService.retrieveGradeScale(FcltType.CHKN, context));

		for (String warning : result.warningList()) {
			log.warn("체크인 공용 Queue 계산 보정: {}, {}", context, warning);
		}

		return result;
	}

	@Override
	public ChknSbdDay retrieveChknSbdDay(String smltId, TerminalKind tmnlId, String excnYmd) {
		List<ChknQueueRawDto> rawList = castChknMapper.retrieveChknQueueRawList(smltId, tmnlId.getFcltTmnlId(), "SBD");
		LocalDate baseDate = LocalDate.parse(excnYmd, DateTimeFormatter.ofPattern(YMD_FORMAT));
		Map<String, Map<Integer, List<ChknQueueRawDto>>> rawListByIslandAndMinute = groupByIslandAndMinute(rawList, baseDate);
		Map<String, int[]> queueByIsland = new LinkedHashMap<>();
		int[] processed = new int[MINUTE_PER_DAY];
		long[] waitSecSum = new long[MINUTE_PER_DAY];
		long[] prcsSecSum = new long[MINUTE_PER_DAY];

		for (Map.Entry<String, Map<Integer, List<ChknQueueRawDto>>> entry : rawListByIslandAndMinute.entrySet()) {
			Map<Integer, List<ChknQueueRawDto>> rawListByMinute = entry.getValue();
			List<Integer> minuteList = new ArrayList<>(rawListByMinute.keySet());
			int[] queue = new int[MINUTE_PER_DAY];

			for (int index = 0; index < minuteList.size(); index++) {
				int bgnMinute = minuteList.get(index);
				int durationMin = intervalDurationMin(minuteList, index);
				List<ChknQueueRawDto> boothList = rawListByMinute.get(bgnMinute);
				int wtngEndPsgCnt = boothList.stream().mapToInt(ChknQueueRawDto::getWtngPsgCnt).sum();

				for (int minute = Math.max(bgnMinute, 0); minute < Math.min(bgnMinute + durationMin, MINUTE_PER_DAY); minute++) {
					queue[minute] = wtngEndPsgCnt;
				}

				if (bgnMinute < 0 || bgnMinute >= MINUTE_PER_DAY) {
					continue;
				}

				for (ChknQueueRawDto raw : boothList) {
					processed[bgnMinute] += raw.getTrnstPsgCnt();
					waitSecSum[bgnMinute] += (long) raw.getWtngHr() * raw.getTrnstPsgCnt();
					prcsSecSum[bgnMinute] += (long) raw.getPrcsHr() * raw.getTrnstPsgCnt();
				}
			}

			queueByIsland.put(entry.getKey(), queue);
		}

		return new ChknSbdDay(queueByIsland, processed, waitSecSum, prcsSecSum);
	}

	private Map<String, Map<Integer, List<ChknQueueRawDto>>> groupByIslandAndMinute(
			List<ChknQueueRawDto> rawList, LocalDate baseDate) {
		Map<String, Map<Integer, List<ChknQueueRawDto>>> result = new LinkedHashMap<>();

		for (ChknQueueRawDto raw : rawList) {
			String island = raw.getIsland() != null ? raw.getIsland().trim() : "";

			if (island.isEmpty() || raw.getSmltActlDt() == null) {
				continue;
			}

			int minute = Math.toIntExact(Duration.between(baseDate.atStartOfDay(), raw.getSmltActlDt()).toMinutes());

			result.computeIfAbsent(island, ignored -> new TreeMap<>())
					.computeIfAbsent(minute, ignored -> new ArrayList<>())
					.add(raw);
		}

		return result;
	}

	private List<ChknQueueInterval> toIntervalList(Map<Integer, List<ChknQueueRawDto>> rawListByMinute) {
		List<Integer> minuteList = new ArrayList<>(rawListByMinute.keySet());
		List<ChknQueueInterval> result = new ArrayList<>();

		for (int index = 0; index < minuteList.size(); index++) {
			int bgnMinute = minuteList.get(index);
			int durationMin = intervalDurationMin(minuteList, index);
			List<ChknQueueRawDto> boothList = rawListByMinute.get(bgnMinute);

			result.add(new ChknQueueInterval(
                bgnMinute,
                durationMin,
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

		intervalList.add(new ChknQueueInterval(
				bgnMinute,
				MINUTE_PER_DAY - bgnMinute,
				last.getWtngEndPsgCnt(),
				0,
				null,
				0));
	}

	private int intervalDurationMin(List<Integer> minuteList, int index) {
		if (index + 1 < minuteList.size()) {
			return minuteList.get(index + 1) - minuteList.get(index);
		}

		if (minuteList.size() < 2) {
			return DEFAULT_INTRVL_MIN;
		}

		return minuteList.get(minuteList.size() - 1) - minuteList.get(minuteList.size() - 2);
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
