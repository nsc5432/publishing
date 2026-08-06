package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FltPsgChartDto {
	private int totCnt; // 누적 값
	private int maxCnt; // Y축 최댓값
	private List<FltPsgChartItemDto> itemList; // 막대 12개
}
