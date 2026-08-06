package aoms.pm.cast.enums;

import com.fasterxml.jackson.annotation.JsonValue;

public enum PrcsGrdType {
	SLFCHKN("SLFCHKN"), // 체크인
	CHKN("CHKN"), // 셀프체크인
	DEP("DEP"),		// 출국장
	SC("SC");		// 보안검색대

	private final String value;
	
	PrcsGrdType(String value) {
		this.value = value;
	}
	
	@JsonValue
	public String getValue() {
		return value;
	}
}
