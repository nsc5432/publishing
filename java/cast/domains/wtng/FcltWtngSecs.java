package aoms.pm.cast.domains.wtng;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * @Classname : FcltWtngSecs.java
 * @Description : 10분 구간 경계와 저장 범위 완전성 검사
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
public final class FcltWtngSecs {
	public static final int SEC_MIN = 10;

	private FcltWtngSecs() {
		throw new UnsupportedOperationException("FcltWtngSecs Class is Utility class.");
	}

	public static boolean isSecBoundary(LocalDateTime dateTime) {
		return dateTime.getSecond() == 0 && dateTime.getNano() == 0 && dateTime.getMinute() % SEC_MIN == 0;
	}

	/** 화면 조회 시각 HHmm 이 00~23시의 10분 경계인지 */
	public static boolean isSecHhmm(String hhmm) {
		if (hhmm == null || !hhmm.matches("\\d{4}")) {
			return false;
		}

		int hour = Integer.parseInt(hhmm.substring(0, 2));
		int minute = Integer.parseInt(hhmm.substring(2, 4));

		return hour < 24 && minute < 60 && minute % SEC_MIN == 0;
	}

	public static LocalDateTime floorSec(LocalDateTime dateTime) {
		LocalDateTime minute = dateTime.truncatedTo(ChronoUnit.MINUTES);

		return minute.minusMinutes(minute.getMinute() % SEC_MIN);
	}

	public static int floorSecMinute(int minute) {
		return Math.floorDiv(minute, SEC_MIN) * SEC_MIN;
	}

	/**
	 * 기대 시설마다 [rangeStart, rangeEnd) 의 10분 구간이 빠짐없이 한 번씩 있는지 확인한다.
	 * @param secMap 시설별 구간 목록 (시각순)
	 * @return 어긋난 사유. 완전하면 null
	 */
	public static String findGap(
			Map<String, List<FcltWtngSec>> secMap,
			Collection<String> unitCdList,
			LocalDateTime rangeStart,
			LocalDateTime rangeEnd
	) {
		if (!isSecBoundary(rangeStart) || !isSecBoundary(rangeEnd) || rangeEnd.isBefore(rangeStart)) {
			return "저장 범위가 10분 경계가 아닙니다. rangeStart=" + rangeStart + ", rangeEnd=" + rangeEnd;
		}

		for (String unitCd : secMap.keySet()) {
			if (!unitCdList.contains(unitCd)) {
				return "기대 시설 목록에 없는 시설 결과가 있습니다. unitCd=" + unitCd;
			}
		}

		long expectedCnt = ChronoUnit.MINUTES.between(rangeStart, rangeEnd) / SEC_MIN;

		for (String unitCd : unitCdList) {
			List<FcltWtngSec> secList = secMap.get(unitCd);

			if (secList == null || secList.size() != expectedCnt) {
				return "시설 결과 구간 수가 기대와 다릅니다. unitCd=" + unitCd
						+ ", expected=" + expectedCnt + ", actual=" + (secList == null ? 0 : secList.size());
			}

			LocalDateTime expectedDt = rangeStart;

			for (FcltWtngSec sec : secList) {
				if (!expectedDt.equals(sec.getSecBgngDt())) {
					return "시설 결과 구간이 비었거나 중복되었습니다. unitCd=" + unitCd + ", expected=" + expectedDt + ", actual=" + sec.getSecBgngDt();
				}

				expectedDt = expectedDt.plusMinutes(SEC_MIN);
			}
		}

		return null;
	}
}
