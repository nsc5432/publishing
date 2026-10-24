package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 묶음 단위(아일랜드 / 출국장) 1곳의 한 시각 상태
 */
@Getter
@Setter
public class MapUnitRsltDto {
	private String unitCd; // 아일랜드 문자 또는 출국장 번호
	private CongestionStatus cgnStatus; // 혼잡도 — 평가시각(hhmm) 직전 30분 처리 여객 평균 대기시간 기준. 산정 불가면 null
	private Double cgnWtngSec; // 혼잡 판정값 — 직전 30분 처리 여객 평균 대기시간 (초, 소수 원값). 산정 불가면 null
	private MapCgnStatDto stat; // 혼잡 현황 지표 4종
}
