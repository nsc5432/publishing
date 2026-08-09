package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 시뮬레이션 구분.
 * 화면은 DAILY / USER 로 주고받고, DB(TN_PM_SMLT_STNG.SMLT_TYPE)는 AUTO / USER 를 쓴다.
 * 변환은 이 enum 안에서만 한다.
 */
public enum SmltType {
	DAILY("DAILY", "AUTO"), // 일일(자동) 시뮬레이션
	USER("USER", "USER"); // 사용자 시뮬레이션

	private final String value;
	private final String dbCode;

	SmltType(String value, String dbCode) {
		this.value = value;
		this.dbCode = dbCode;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public String getDbCode() {
		return dbCode;
	}

	public static SmltType ofDbCode(String dbCode) {
		return USER.dbCode.equals(dbCode) ? USER : DAILY;
	}

	public static List<SmltType> getList() {
		return List.of(SmltType.DAILY, SmltType.USER);
	}
}
