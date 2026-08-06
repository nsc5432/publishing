package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CknctCntRawDto {
	private String island; // 아일랜드 문자 — CKNCT_ID 1번째 자리
	private int cknctCnt; // 카운터 보유 대수
}
