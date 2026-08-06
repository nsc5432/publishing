package aoms.pm.cast.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SlfType {
	KIOSK("KIOSK"),
	SBD("SBD");

	private final String value;
	
	SlfType(String value) {
		this.value = value;
	}
	
	@JsonValue
	public String getValue() {
		return value;
	}
}


