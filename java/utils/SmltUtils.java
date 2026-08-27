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

import aoms.pm.cast.domains.AggBuffer;
import aoms.pm.cast.domains.AggData;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.enums.CongestionStatus;

public class SmltUtils {
	private SmltUtils() {
		throw new UnsupportedOperationException("SmltUtils Class is Utility class.");
	}
	
	private static final Set<Integer> VAILD_INTERVALS = Set.of(1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60);
	private static final List<CongestionStatus> CONGESTION_LIST = CongestionStatus.getList();
	
	public static <T extends AggData> List<T> aggregate(List<T> src, int interval, Supplier<T> factory) {
		Map<String, AggBuffer<T>> bufferMap = new LinkedHashMap<>();
		
		for (T item : src) {
			String key = SmltUtils.groupKey(item.getTime(), interval);
			AggBuffer<T> buffer = bufferMap.get(key);
			
			if (buffer == null) {
				bufferMap.put(key, new AggBuffer<>(item, factory));
			} else {
				buffer.merge(item);
			}
		}
		
		return bufferMap.entrySet().stream().map(x -> x.getValue().toData(x.getKey())).collect(toList());
	}
	
	public static String groupKey(String time, int interval) { 
		if (!VAILD_INTERVALS.contains(interval)) { // interval 은 60 의 약수로 제한
			throw new IllegalArgumentException("interval 값을 60의 약수로 입력하세요. interval :: " + interval);
		}
		
		int h = Integer.parseInt(time.substring(0, 2));
		int m = Integer.parseInt(time.substring(2, 4));
		int groupMinute = m / interval * interval;
		
		return String.format("%02d%02d", h, groupMinute);
	}
	
	public static CongestionStatus getCongestionStatus(Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap, int cnt) {
		for (CongestionStatus congestion : CONGESTION_LIST) {
			PsgPrcsGrd target = prcsGrdMap.get(congestion);
			
			if (target.getMinVl() <= cnt && cnt <= target.getMaxVl()) {
				return target.getCgnStatus();
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
}
