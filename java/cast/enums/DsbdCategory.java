package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DsbdCategory {
	PSG("PSG"),
	FLT("FLT"),
	CHKN("CHKN"),
	DEP("DEP");

	// LS 랜드사이드 좌석, CC 체크인카운터, CK 셀프체크인, SBD 셀프백드랍, LGT 출국장, LC 출국심사, SC 보안검색대, SR 보안검색대RED
	private static final List<String> ALL_FCLT_CD_LIST = List.of("LS", "CC", "CK", "SBD", "LGT", "LC", "SC", "SR");
	private static final List<String> DPTGT_FCLT_CD_LIST = List.of("LGT", "LC", "SC", "SR");

	private static final List<String> DEP_WTNG_TYPE_CD_LIST = List.of("DG", "SC");
	// 빈 리스트를 넘기면 mapper 가 유형 필터를 건너뛰어 미정의 유형까지 MAX 에 섞인다
	private static final List<String> ALL_WTNG_TYPE_CD_LIST = List.of("Queue", "DG", "SC");

	private final String value;

	DsbdCategory(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public List<String> getUpPsgFcltCdList() {
		if (this == DEP) {
			return DPTGT_FCLT_CD_LIST;
		}

		return ALL_FCLT_CD_LIST;
	}

	public List<String> getPsgWtngFcltTypeCdList() {
		if (this == DEP) {
			return DEP_WTNG_TYPE_CD_LIST;
		}

		return ALL_WTNG_TYPE_CD_LIST;
	}

	public static List<DsbdCategory> getList() {
		return List.of(DsbdCategory.PSG, DsbdCategory.FLT, DsbdCategory.CHKN, DsbdCategory.DEP);
	}
}
