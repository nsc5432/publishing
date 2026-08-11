package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 저장분 — 보안검색대 운영계획 1구간 (TN_PM_SMLT_SC_PLAN) */
@Getter
@Setter
public class UserScPlanRawDto {
	private String depNum; // 출국장 번호 — 부모 키
	private int planSn; // 행 일련번호
	private int bgnHour; // 구간 시작 (0~24)
	private int endHour; // 구간 종료 (0~24)
	private int scCnt; // 그 구간 검색대 갯수
}
