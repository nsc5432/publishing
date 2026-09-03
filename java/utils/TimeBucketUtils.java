package aoms.pm.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
	private static final int MINUTE_PER_HOUR = 60;
	private static final int MINUTE_PER_DAY = HOUR_PER_DAY * MINUTE_PER_HOUR;
	private static final int SLOT_STEP_MIN = 30;
	private static final String HOUR_FORMAT = "%02d";
	private static final String HM_FORMAT = "%02d%02d";
	private static final List<String> BUCKET_MINUTE_LIST = List.of("00", "30"); // 30분 버킷

	private TimeBucketUtils() {
	}

	public static List<String> hourList() {
		List<String> result = new ArrayList<>();

		for (int h = 0; h < HOUR_PER_DAY; h++) {
			result.add(String.format(HOUR_FORMAT, h));
		}

		return result;
	}

	public static List<String> bucketList() {
		List<String> result = new ArrayList<>();

		for (String hour : hourList()) {
			result.addAll(bucketList(hour));
		}

		return result;
	}

	public static List<String> bucketList(String hour) {
		return BUCKET_MINUTE_LIST.stream().map(minute -> hour + minute).collect(Collectors.toList());
	}

	/**
	 * bgnHour 시부터 24:00 까지를 30분으로 나눈 눈금 — 화면 하단 타임라인과 같은 구간이다.
	 * 마지막 2400 은 하루의 끝을 닫는 눈금이라 대응하는 결과 버킷(…2330)이 없어 항상 0 이다.
	 */
	public static List<String> slotTimeList(int bgnHour) {
		List<String> result = new ArrayList<>();

		for (int minutes = bgnHour * MINUTE_PER_HOUR; minutes <= MINUTE_PER_DAY; minutes += SLOT_STEP_MIN) {
			result.add(String.format(HM_FORMAT, minutes / MINUTE_PER_HOUR, minutes % MINUTE_PER_HOUR));
		}

		return result;
	}
}
