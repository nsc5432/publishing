package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 체크인카운터 화면 30분 슬롯 1칸 */
@Getter
@Setter
public class ChknCounterSlotDto {
	private String hhmm; // 슬롯 시각 HHmm
	private MapNoticeDto notice; // 상단 혼잡 알림 (아일랜드만)
	private List<MapChknRsltDto> chknRsltList; // 아일랜드별 상태
}
