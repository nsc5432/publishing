package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 아일랜드는 상세 팝업에 처리율과 공용 Queue 값이 더 붙는다 */
@Getter
@Setter
public class MapChknRsltDto extends MapUnitRsltDto {
	private int prcsRate; // 처리율 (%)
	private int avgQueuePsgCnt; // 30분 평균 Queue 인원 (명)
	private int maxQueuePsgCnt; // 30분 최대 Queue 인원 (명)
	private int oprBoothCnt; // 슬롯 마지막 운영 부스 수 (개)
	private Integer reqCnt; // NORMAL 이하를 위한 총 소요 부스 수 — 산정 불가면 null
	private Integer cgnClearMin; // 추천 적용 후 NORMAL 도달 예상 분 — 산정 불가면 null
}
