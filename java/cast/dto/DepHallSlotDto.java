package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 출국장 화면 타임라인 한 칸(30분) */
@Getter
@Setter
public class DepHallSlotDto {
	private String hhmm; // 슬롯 시각 HHmm (30분 단위)
	private MapNoticeDto notice; // 상단 혼잡 알림 (출국장만 담는다)
	private List<MapUnitRsltDto> dptgtRsltList; // 출국장 카드 · 마커
	private List<MapUnitRsltDto> chknRsltList; // 아일랜드 마커 색만 맞춘다
}
