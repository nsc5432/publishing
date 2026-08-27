package aoms.pm.utils;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import aoms.pm.cast.domains.AggBuffer;
import aoms.pm.cast.domains.AggData;
import aoms.pm.cast.dto.MapCgnStatDto;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.enums.CongestionStatus;

public class SmltUtils {
	private static final Set<Integer> VALID_INTERVALS = Set.of(1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60);
	private static final List<CongestionStatus> CONGESTION_LIST = CongestionStatus.getList();

	private static final String EMPTY = "";
	private static final String DEFAULT_HM = "0000";
	private static final String ZERO_MIN = "00";
	private static final int HM_LENGTH = 4;
	private static final int HOUR_PER_DAY = 24;
	private static final int PERCENT = 100;

	private SmltUtils() {
		throw new UnsupportedOperationException("SmltUtils Class is Utility class.");
	}

	public static <T extends AggData> List<T> aggregate(List<T> src, int interval, Supplier<T> factory) {
		Map<String, AggBuffer<T>> bufferMap = new LinkedHashMap<>();

		if (src != null && !src.isEmpty()) {
			for (T item : src) {
				String key = groupKey(item.getTime(), interval);
				AggBuffer<T> buffer = bufferMap.get(key);

				if (buffer == null) {
					bufferMap.put(key, new AggBuffer<>(item, factory));
				} else {
					buffer.merge(item);
				}
			}
		}

		return bufferMap.entrySet().stream()
				.map(entry -> entry.getValue().toData(entry.getKey()))
				.collect(toList());
	}

	public static String groupKey(String time, int interval) {
		if (!VALID_INTERVALS.contains(interval)) {
			throw new IllegalArgumentException("interval 값을 60의 약수로 입력하세요. interval :: " + interval);
		}

		int hour = Integer.parseInt(time.substring(0, 2));
		int minute = Integer.parseInt(time.substring(2, HM_LENGTH));

		return String.format("%02d%02d", hour, minute / interval * interval);
	}

	public static CongestionStatus getCongestionStatus(Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap, int cnt) {
		for (CongestionStatus congestion : CONGESTION_LIST) {
			if (prcsGrdMap != null) {
				PsgPrcsGrd target = prcsGrdMap.get(congestion);

				if (target.getMinVl() <= cnt && cnt <= target.getMaxVl()) {
					return target.getCgnStatus();
				}
			}
		}

		return CongestionStatus.FREE;
	}

	public static List<TimeRange> mergeTimeRanges(List<TimeRange> ranges) {
		if (ranges == null || ranges.size() <= 1) {
			return ranges;
		}

		List<TimeRange> result = new ArrayList<>();
		Collections.sort(ranges, Comparator.comparingInt(TimeRange::getStart));

		TimeRange currentRange = ranges.get(0);
		result.add(currentRange);

		for (TimeRange nextRange : ranges) {
			if (nextRange.getStart() <= currentRange.getEnd()) {
				currentRange.setEnd(Math.max(currentRange.getEnd(), nextRange.getEnd()));
			} else {
				currentRange = nextRange;
				result.add(currentRange);
			}
		}

		return result;
	}

	/**
	 * 하루치 결과를 시각 → (묶음 단위 → 결과) 로 접는다.
	 * 상위시설코드가 여러 개 걸린 묶음 단위(아일랜드 · 출국장)는 한 건이 된다.
	 * 맵형태보기 · 출국장 · 체크인카운터가 같은 규칙을 써야 같은 시설의 값이 화면마다 달라지지 않는다.
	 */
	public static Map<String, Map<String, SmltRsltRawDto>> foldByTimeAndUnitCd(List<SmltRsltRawDto> rsltList) {
		Map<String, List<SmltRsltRawDto>> timeMap = rsltList.stream()
				.collect(Collectors.groupingBy(SmltRsltRawDto::getTime, LinkedHashMap::new, Collectors.toList()));

		Map<String, Map<String, SmltRsltRawDto>> result = new LinkedHashMap<>();

		for (Map.Entry<String, List<SmltRsltRawDto>> entry : timeMap.entrySet()) {
			result.put(entry.getKey(), foldByUnitCd(entry.getValue()));
		}

		return result;
	}

	/** 이 화면들의 시간 지표는 초 단위다 (대시보드 KPI 는 분이라 환산하지 않는다). */
	public static MapCgnStatDto toCgnStat(SmltRsltRawDto rslt) {
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

	public static int toPrcsRate(int prcsPsgCnt, int wtngPsgCnt) {
		int total = prcsPsgCnt + wtngPsgCnt;

		return total == 0 ? 0 : prcsPsgCnt * PERCENT / total;
	}

	public static String defaultHm(String hhmm) {
		return hhmm != null && hhmm.length() >= HM_LENGTH ? hhmm : DEFAULT_HM;
	}

	public static int toBgnHour(String hhmm) {
		return Integer.parseInt(defaultHm(hhmm).substring(0, 2));
	}

	/** 종료 시각은 분이 남으면 다음 시로 올린다. 자정 넘김(RON)은 당일 24시로 자른다. */
	public static int toEndHour(String bgnHm, String endHm) {
		String value = defaultHm(endHm);
		int hour = Integer.parseInt(value.substring(0, 2));

		if (!ZERO_MIN.equals(value.substring(2, HM_LENGTH))) {
			hour++;
		}

		return hour <= toBgnHour(bgnHm) ? HOUR_PER_DAY : hour;
	}

	// 대기는 가장 나쁜 값(최댓값), 처리인원은 흘러간 사람 수라 합산이다
	private static Map<String, SmltRsltRawDto> foldByUnitCd(List<SmltRsltRawDto> rsltList) {
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
}
