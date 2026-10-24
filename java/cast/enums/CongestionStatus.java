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

	public static CongestionStatus ofGradeCode(String gradeCode) {
		switch (gradeCode) {
			case "01":
				return FREE;
			case "02":
				return NORMAL;
			case "03":
				return BUSY;
			case "04":
				return VERY_BUSY;
			default:
				throw new IllegalArgumentException("지원하지 않는 혼잡등급 코드입니다. psgPrcsGrdCd=" + gradeCode);
		}
	}

	public static List<CongestionStatus> getList() {
		return List.of(CongestionStatus.FREE, CongestionStatus.NORMAL, CongestionStatus.BUSY, CongestionStatus.VERY_BUSY);
	}
}
