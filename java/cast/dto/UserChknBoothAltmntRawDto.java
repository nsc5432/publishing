package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 부스 1석의 항공사 배정 1구간 — 사용자 저장분(TN_PM_SMLT_USER_CHKN_BOOTH_ALTMNT) · 실행 조건(CA 리소스) 공용 */
@Getter
@Setter
public class UserChknBoothAltmntRawDto {
	private String island; // 아일랜드 문자 — 부모 키
	private int boothNo; // 부스 번호 (1부터)
	private String alnCd; // 배정 항공사 코드
	private int operBgngHour; // 운영 시작 시 (0~23)
	private int operEndHour; // 운영 종료 시 (1~24)
}
