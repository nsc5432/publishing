package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CongestionStatus {
	FREE("FREE"),
	NORMAL("NORMAL"),
	BUSY("BUSY"),
	VERY_BUSY("VERY_BUSY");

    // TODO
	// 아직 DB 등급표로 전환하지 않은 화면의 호환 경계값이다.
	private static final int FREE_MAX_WTNG_PSG_CNT = 80;
	private static final int NORMAL_MAX_WTNG_PSG_CNT = 220;
	private static final int BUSY_MAX_WTNG_PSG_CNT = 420;

	private final String value;

	CongestionStatus(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public static CongestionStatus ofWtngPsgCnt(int wtngPsgCnt) {
		if (wtngPsgCnt <= FREE_MAX_WTNG_PSG_CNT) {
			return FREE;
		}

		if (wtngPsgCnt <= NORMAL_MAX_WTNG_PSG_CNT) {
			return NORMAL;
		}

		return wtngPsgCnt <= BUSY_MAX_WTNG_PSG_CNT ? BUSY : VERY_BUSY;
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
