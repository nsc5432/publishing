package aoms.pm.cast.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CongestionType {
	PEAK_PSG("PEAK_PSG"),
	PEAK_CHKN("PEAK_CHKN"),
	PEAK_DEP("PEAK_DEP"),
	PEAK_SC("PEAK_SC");

	private final String value;
	
	CongestionType(String value) {
		this.value = value;
	}
	
	@JsonValue
	public String getValue() {
		return value;
	}
}


