package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 게이트 카드의 추천 조치
 */
@Getter
@Setter
public class FcltRecommendDto {
	private String targetNm; // 추천 대상
	private int addCnt; // 추가 필요 수량 (개)
	private String needAssignYn; // Y 배정 필요 / N 소요
}
