package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CongestionStatus {
	FREE("FREE"),
	NORMAL("NORMAL"),
	BUSY("BUSY"),
	VERY_BUSY("VERY_BUSY");

	private final String value;
	
	CongestionStatus(String value) {
		this.value = value;
	}
	
	@JsonValue
	public String getValue() {
		return value;
	}
	
	public static List<CongestionStatus> getList() {
		return List.of(CongestionStatus.FREE, CongestionStatus.NORMAL, CongestionStatus.BUSY, CongestionStatus.VERY_BUSY);
	}
}


