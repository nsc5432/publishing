package aoms.pm.cast.enums;

import java.time.DayOfWeek;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 대시보드 요일 속성 카드의 요일 구분.
 * 공휴일 달력 테이블이 확인되지 않아 HOLIDAY 는 아직 나오지 않는다 (G1 계열 미확인 항목).
 */
public enum DowType {
	WEEKDAY("WEEKDAY"), // 평일
	WEEKEND("WEEKEND"), // 주말
	PRE_WEEKEND("PRE_WEEKEND"), // 주말 전일
	HOLIDAY("HOLIDAY"); // 공휴일

	private final String value;

	DowType(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public static DowType of(DayOfWeek dayOfWeek) {
		if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
			return WEEKEND;
		}

		return dayOfWeek == DayOfWeek.FRIDAY ? PRE_WEEKEND : WEEKDAY;
	}

	public static List<DowType> getList() {
		return List.of(DowType.WEEKDAY, DowType.WEEKEND, DowType.PRE_WEEKEND, DowType.HOLIDAY);
	}
}
