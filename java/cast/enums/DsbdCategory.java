package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 대시보드 퀵 액세스 타일 = 시간대별 결과의 조회 대상 지표.
 * 타일마다 집계 대상 상위시설코드(UP_PSG_FCLT_CD) 집합이 다르다.
 */
public enum DsbdCategory {
	PSG("PSG"), // 터미널 여객수
	FLT("FLT"), // 운항편
	CHKN("CHKN"), // 체크인카운터
	DEP("DEP"); // 출국장

	// LS 랜드사이드 좌석, CC 체크인카운터, CK 셀프체크인, SBD 셀프백드랍, LGT 출국장, LC 출국심사, SC 보안검색대, SR 보안검색대RED
	private static final List<String> ALL_FCLT_CD_LIST = List.of("LS", "CC", "CK", "SBD", "LGT", "LC", "SC", "SR");
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");
	private static final List<String> DPTGT_FCLT_CD_LIST = List.of("LGT", "LC", "SC", "SR");

	// 여객대기정보(Xovis)는 시설 구분이 시뮬레이션과 다르다 — Queue 체크인 대기열, DG 출국장, SC 보안검색대
	private static final List<String> CHKN_WTNG_TYPE_CD_LIST = List.of("Queue");
	private static final List<String> DEP_WTNG_TYPE_CD_LIST = List.of("DG", "SC");

	private final String value;

	DsbdCategory(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	/**
	 * 집계 대상 상위시설코드.
	 * PSG·FLT 는 터미널 전체를 본다 — FLT 는 편수만 운항 원본에서 따로 채운다.
	 */
	public List<String> getUpPsgFcltCdList() {
		if (this == CHKN) {
			return CHKN_FCLT_CD_LIST;
		}

		if (this == DEP) {
			return DPTGT_FCLT_CD_LIST;
		}

		return ALL_FCLT_CD_LIST;
	}

	/**
	 * 여객대기정보(Xovis) 집계 대상 시설유형코드.
	 * PSG·FLT 는 터미널에서 측정된 대기열 전체를 보므로 빈 목록(= 유형 조건 없음)이다.
	 */
	public List<String> getPsgWtngFcltTypeCdList() {
		if (this == CHKN) {
			return CHKN_WTNG_TYPE_CD_LIST;
		}

		if (this == DEP) {
			return DEP_WTNG_TYPE_CD_LIST;
		}

		return List.of();
	}

	public static List<DsbdCategory> getList() {
		return List.of(DsbdCategory.PSG, DsbdCategory.FLT, DsbdCategory.CHKN, DsbdCategory.DEP);
	}
}
