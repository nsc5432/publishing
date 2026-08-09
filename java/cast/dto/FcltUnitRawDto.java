package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** TN_PM_SMLT_PSG_FCLT 의 화면 묶음 단위별 시설 보유 대수 (게이트 카드의 전체/운영 개수) */
@Getter
@Setter
public class FcltUnitRawDto {
	private String unitCd; // 아일랜드 문자 또는 출국장 번호
	private int totCnt; // 보유 대수
	private int oprCnt; // USE_YN = 'Y' 대수
}
