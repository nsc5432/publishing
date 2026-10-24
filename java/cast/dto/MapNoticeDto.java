package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/** 상단 혼잡 알림 */
@Getter
@Setter
public class MapNoticeDto {
	private CongestionStatus cgnStatus; // 알림 단계 — 산정 가능한 시설 중 최고 등급. 전부 산정 불가면 null
	private List<MapNoticeItemDto> itemList; // 조치 대상 시설
}
