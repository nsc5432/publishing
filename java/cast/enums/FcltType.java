package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 화면이 쓰는 여객시설 구분.
 * DB 의 UP_PSG_FCLT_CD 는 19종이라 1:1 이 아니다 — 화면 묶음 단위로 접는다.
 */
public enum FcltType {
	CHKN("CHKN"), // 체크인카운터
	SLFCHKN("SLFCHKN"), // 셀프체크인 · 셀프백드랍
	DEP("DEP"), // 출국장
	SC("SC"), // 보안검색대
	CMRC("CMRC"); // 상업시설

	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC");
	private static final List<String> SLFCHKN_FCLT_CD_LIST = List.of("CK", "SBD");
	private static final List<String> DPTGT_FCLT_CD_LIST = List.of("LGT");
	private static final List<String> SC_FCLT_CD_LIST = List.of("SC", "SR");

	private final String value;

	FcltType(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	/**
	 * 대응하는 상위시설코드. 상업시설(CMRC)은 TN_PM_SMLT_PSG_FCLT 에 대응 코드가 없어 빈 목록이다.
	 */
	public List<String> getUpPsgFcltCdList() {
		switch (this) {
			case CHKN:
				return CHKN_FCLT_CD_LIST;
			case SLFCHKN:
				return SLFCHKN_FCLT_CD_LIST;
			case DEP:
				return DPTGT_FCLT_CD_LIST;
			case SC:
				return SC_FCLT_CD_LIST;
			default:
				return List.of();
		}
	}

	public static List<FcltType> getList() {
		return List.of(FcltType.CHKN, FcltType.SLFCHKN, FcltType.DEP, FcltType.SC, FcltType.CMRC);
	}
}
