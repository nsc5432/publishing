package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 출국장 1곳의 하루 추이 — 꺾은선 1개 */
@Getter
@Setter
public class DepHallTrendSeriesDto {
	private String depNum; // 출국장 번호
	private String depNm; // 표시명 (예: 출국장 3)
	private List<DepHallTrendItemDto> itemList; // timeList 와 같은 길이·순서 (빈 구간은 0)
}
