package aoms.pm.cast.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum FcltQueueScenarioMode {
	COUNT("COUNT"), // 시설 수 조정 → 혼잡해소 예상
	TIME("TIME"); // 목표 해소시간 → 추천 총수량

	private final String value;

	FcltQueueScenarioMode(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}
}
