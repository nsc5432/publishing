package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 사용자 저장분 — 부스 1석의 항공사 배정 (TN_PM_SMLT_USER_CHKN_BOOTH) */
@Getter
@Setter
public class UserChknBoothRawDto {
	private String island; // 아일랜드 문자 — 부모 키
	private int boothNo; // 부스 번호 (1부터)
	private String alnCd; // 배정 항공사 코드 — 미배정이면 null
	private String customYn; // Custom 배정 여부
}
