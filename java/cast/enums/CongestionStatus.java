package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum CongestionStatus {
	FREE("FREE"),
	NORMAL("NORMAL"),
	BUSY("BUSY"),
	VERY_BUSY("VERY_BUSY");

	// 대기인원 기준 경계값.
	// 정식 기준표는 PMOWN.TN_PM_PSG_PRCS_GRD (FCLT_GROUP_CD 별 MIN_VL/MAX_VL) 가 갖고 있으나
	// 시설 그룹 코드 매핑이 확정되지 않아 우선 공통 경계값을 쓴다.
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

	/** 대기인원으로 혼잡 단계를 정한다. Mock · DB 구현이 같은 기준을 쓰도록 여기 한 곳에 둔다 */
	public static CongestionStatus ofWtngPsgCnt(int wtngPsgCnt) {
		if (wtngPsgCnt <= FREE_MAX_WTNG_PSG_CNT) {
			return FREE;
		}

		if (wtngPsgCnt <= NORMAL_MAX_WTNG_PSG_CNT) {
			return NORMAL;
		}

		return wtngPsgCnt <= BUSY_MAX_WTNG_PSG_CNT ? BUSY : VERY_BUSY;
	}

	public static List<CongestionStatus> getList() {
		return List.of(CongestionStatus.FREE, CongestionStatus.NORMAL, CongestionStatus.BUSY, CongestionStatus.VERY_BUSY);
	}
}


