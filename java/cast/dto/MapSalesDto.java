package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 상세의 매출
 */
@Getter
@Setter
public class MapSalesDto {
	private long totAmt; // 총 매출 (원)
	private int storeCnt; // 상업시설 수
	private int amtPerPsg; // 인원대비 매출 (원)
	private int psgDiffCnt; // 매출 인원 증감 (명)
	private int diffRate; // 증감률 (%)
	private String cmprYear = ""; // 비교 기준 연도
}
