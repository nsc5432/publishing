package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 게이트 카드의 추천 조치.
 * 추천 로직(어느 항공사에 몇 개를 더 열 것인가)은 아직 정의되지 않았다 — DB 모드에서는 기본값이다.
 */
@Getter
@Setter
public class FcltRecommendDto {
	private String targetNm; // 추천 대상 (예: 대한항공 / 보안검색대)
	private int addCnt; // 추가 필요 수량 (개)
	private String needAssignYn; // Y 배정 필요 / N 소요
}
