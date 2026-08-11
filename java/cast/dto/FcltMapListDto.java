package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/** 시설물 매핑 목록 (터미널 1개분 전량) */
@Getter
@Setter
public class FcltMapListDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId;
	private List<FcltMapItemDto> itemList = new ArrayList<>();
	private List<MapMarkerDto> markerList = new ArrayList<>(); // 도면 마커 (아일랜드 · 출국장)
}
