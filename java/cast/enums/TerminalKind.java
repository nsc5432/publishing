package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TerminalKind {
	T1("T1"),
	T2("T2");

	private static final String TMNL_ID_P01 = "P01"; // 제1여객터미널
	private static final String TMNL_ID_P02 = "P02"; // 탑승동
	private static final String TMNL_ID_P03 = "P03"; // 제2여객터미널

	private final String value;

	TerminalKind(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	// 시설(체크인카운터·출국장·검색대) 조회용 터미널 코드. 탑승동(P02)은 시설 결과가 없다
	public String getFcltTmnlId() {
		return this == T1 ? TMNL_ID_P01 : TMNL_ID_P03;
	}

	// 운항편·여객수 집계용 터미널 코드. T1 은 제1여객터미널 + 탑승동 합산
	public List<String> getFltTmnlIdList() {
		return this == T1 ? List.of(TMNL_ID_P01, TMNL_ID_P02) : List.of(TMNL_ID_P03);
	}

	public static List<TerminalKind> getList() {
		return List.of(TerminalKind.T1, TerminalKind.T2);
	}
}
