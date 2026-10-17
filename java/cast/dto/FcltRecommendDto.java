package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FcltRecommendDto {
	private String targetNm; // 추천 대상
	private Integer reqCnt; // 30분 안에 NORMAL 이하로 해소되는 총 소요 수량 (개). 산정 불가면 null
	private String needAssignYn; // Y 배정 필요 / N 소요
}
