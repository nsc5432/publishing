package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FcltRecommendDto {
	private String targetNm; // 추천 대상
	private int addCnt; // SLA 충족에 필요한 총 소요 수량 (개)
	private String needAssignYn; // Y 배정 필요 / N 소요
}
