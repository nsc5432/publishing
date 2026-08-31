package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * PM 업무 롤. 값은 CAOWN.TN_CA_ROLE.ROLE_ID 원본이다
 */
public enum PmRole {
	BASIC("PMR0001"),			// PM 기본 — 접근 가능한 화면 없음
	OPER_CENTER("PMR0002"),		// PM 통합운영센터
	OPER_PLAN("PMR0003"),		// PM 운영기획
	SALES("PMR0004"),			// PM 매출조회
	FORECAST("PMR0005"),		// PM 예측관련
	SYS_ADMIN("PMR0006");		// PM 시스템 관리

	private final String value;

	PmRole(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public static List<PmRole> getList() {
		return List.of(BASIC, OPER_CENTER, OPER_PLAN, SALES, FORECAST, SYS_ADMIN);
	}
}
