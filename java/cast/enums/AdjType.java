package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum AdjType {
	RATIO("RATIO"),		// 전체 비율
	HOURLY("HOURLY");	// 시간대별

	private final String value;

	AdjType(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public static List<AdjType> getList() {
		return List.of(AdjType.RATIO, AdjType.HOURLY);
	}
}
