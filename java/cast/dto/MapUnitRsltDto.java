package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 묶음 단위(아일랜드 · 출국장) 1곳의 한 시각 상태.
 * 마커 색과 상세 팝업이 <b>이 한 건</b>을 나눠 쓴다.
 */
@Getter
@Setter
public class MapUnitRsltDto {
	private String unitCd; // 아일랜드 문자(A~N) 또는 출국장 번호(1~6)
	private CongestionStatus cgnStatus; // 마커 색 · 상태 뱃지
	private MapCgnStatDto stat; // 혼잡 현황 지표 4종
}
