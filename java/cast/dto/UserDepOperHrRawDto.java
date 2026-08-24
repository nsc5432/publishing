package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 저장분 — 출국장 운영시간 1구간 (TN_PM_SMLT_USER_DPTGT_OPER_HR) */
@Getter
@Setter
public class UserDepOperHrRawDto {
	private String dptgtNo; // 출국장 번호 — 부모 키
	private int operBgngHour; // 운영 시작 (0~24)
	private int operEndHour; // 운영 종료 (0~24)
}
