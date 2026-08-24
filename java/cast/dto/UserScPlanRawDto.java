package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 저장분 — 보안검색대 운영계획 1구간 (TN_PM_SMLT_SCSH_OPER_PLAN) */
@Getter
@Setter
public class UserScPlanRawDto {
	private String dptgtNo; // 출국장 번호 — 부모 키
	private int planSn; // 행 일련번호
	private int operBgngHour; // 구간 시작 (0~24)
	private int operEndHour; // 구간 종료 (0~24)
	private int scshCntom; // 그 구간 검색대 갯수
}
