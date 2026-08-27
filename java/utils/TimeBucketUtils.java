package aoms.pm.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import aoms.pm.cast.domains.AggData;

/**
 * @Classname   : TimeBucketUtils.java
 * @Description :  24시간 시간대 버킷 공통 유틸
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 *------------------------------------------------------------------------------
 * Modification Information
 *------------------------------------------------------------------------------
 * 수정일 / 수정자 /수정내용
 * ----------  ------  ---------------------------------------------------------
 * 2026. 08. 07 / 노세찬 / 최초작성
 *------------------------------------------------------------------------------
 *
 * </pre>
 */
public class TimeBucketUtils {
	private static final int HOUR_PER_DAY = 24;
	private static final String HOUR_FORMAT = "%02d";
	private static final List<String> BUCKET_MINUTE_LIST = List.of("00", "30"); // 30분 버킷

	private TimeBucketUtils() {
	}

	// 00 ~ 23 (24개)
	public static List<String> hourList() {
		List<String> result = new ArrayList<>();

		for (int h = 0; h < HOUR_PER_DAY; h++) {
			result.add(String.format(HOUR_FORMAT, h));
		}

		return result;
	}

	// 0000, 0030 ... 2330 (48개)
	public static List<String> bucketList() {
		List<String> result = new ArrayList<>();

		for (String hour : hourList()) {
			result.addAll(bucketList(hour));
		}

		return result;
	}

	// 지정한 시(HH)의 버킷 2개 — HH00, HH30
	public static List<String> bucketList(String hour) {
		return BUCKET_MINUTE_LIST.stream().map(minute -> hour + minute).collect(Collectors.toList());
	}

	// 집계 결과를 30분 버킷 48개에 채운다. 해당 버킷에 데이터가 없으면 빈 목록이 들어간다
	public static <T extends AggData> Map<String, List<T>> groupByBucket(List<T> datas) {
		Map<String, List<T>> result = new TreeMap<>();
		Map<String, List<T>> groupedByTime = datas.stream()
				.filter(x -> x.getTime() != null)
				.collect(Collectors.groupingBy(AggData::getTime));

		for (String bucket : bucketList()) {
			result.put(bucket, groupedByTime.getOrDefault(bucket, new ArrayList<>()));
		}

		return result;
	}
}
