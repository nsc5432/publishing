package aoms.pm.cast.enums;

import java.util.List;
import java.util.Set;

/**
 * @Classname : UserSmltReqStatus.java
 * @Description : 사용자 시뮬레이션 실행 요청 상태 — TN_PM_SMLT_USER_MSTR.SMLT_STTS
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 27. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public enum UserSmltReqStatus {
	// CAST 가 REQ_SetResource 로 보내는 문자열을 그대로 값으로 쓴다. 화면의 RUNNING/DONE 과 별개다
	NEW("New"),
	EXECUTING("Executing"),
	FINISHED("Finished"),
	FAILED("Failed");

	private final String value;

	UserSmltReqStatus(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}

	public static UserSmltReqStatus ofValue(String value) {
		for (UserSmltReqStatus status : values()) {
			if (status.value.equals(value)) {
				return status;
			}
		}

		return null;
	}

	public boolean canTransitTo(UserSmltReqStatus next) {
		if (next == null) {
			return false;
		}

		return allowedNext().contains(next);
	}

	public boolean isClosed() {
		return this == FINISHED || this == FAILED;
	}

	// 수행이력 · 화면은 실행 요청보다 상태가 거칠다. 여기서 한 번만 접는다
	public SmltExecStatus toExecStatus() {
		switch (this) {
			case FINISHED:
				return SmltExecStatus.DONE;
			case FAILED:
				return SmltExecStatus.FAILED;
			default:
				return SmltExecStatus.RUNNING;
		}
	}

	public static List<UserSmltReqStatus> getList() {
		return List.of(NEW, EXECUTING, FINISHED, FAILED);
	}

	private Set<UserSmltReqStatus> allowedNext() {
		switch (this) {
			case NEW:
				return Set.of(EXECUTING, FAILED);
			case EXECUTING:
				return Set.of(FINISHED, FAILED);
			default:
				return Set.of();
		}
	}
}
