package aoms.pm.cast.enums;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SmltExecStatus {
	RUNNING("RUNNING"),	// 진행중
	DONE("DONE"),		// 완료
	FAILED("FAILED");	// 실패

	private final String value;

	SmltExecStatus(String value) {
		this.value = value;
	}

	@JsonValue
	public String getValue() {
		return value;
	}

	public static List<SmltExecStatus> getList() {
		return List.of(SmltExecStatus.RUNNING, SmltExecStatus.DONE, SmltExecStatus.FAILED);
	}
}
