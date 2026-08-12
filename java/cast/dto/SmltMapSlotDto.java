package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 맵형태보기 타임라인 한 칸(30분) */
@Getter
@Setter
public class SmltMapSlotDto {
	private String hhmm; // 슬롯 시각 HHmm (30분 단위)
	private MapNoticeDto notice; // 상단 혼잡 알림
	private List<MapChknRsltDto> chknRsltList; // 아일랜드 A~N
	private List<MapUnitRsltDto> depRsltList; // 출국장 (T1 6곳 / T2 2곳)
}
