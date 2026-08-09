package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 시간대별 출발여객 — 터미널 1개분 */
@Getter
@Setter
public class HourlyPsgDto {
	private String tmnlId; // T1 / T2
	private int totPsgCnt; // 카드 헤더의 터미널 합계
	private int maxPsgCnt; // Y축 최댓값
	private List<HourlyPsgItemDto> itemList; // 시간 막대 24개
}
