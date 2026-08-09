package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 상세 팝업의 매출.
 * 상업시설 매출 원천이 확인되지 않아 DB 모드에서는 전 필드가 기본값이다 (결정 로그 D7).
 */
@Getter
@Setter
public class MapSalesDto {
	private long totAmt; // 총 매출 (원)
	private int storeCnt; // 상업시설 수
	private int amtPerPsg; // 인원대비 매출 (원)
	private int psgDiffCnt; // 매출 인원 증감 (명)
	private int diffRate; // 증감률 (%) — 음수 가능
	private String cmprYear; // 비교 기준 연도
}
