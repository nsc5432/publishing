package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 상단 혼잡 알림 1건 */
@Getter
@Setter
public class MapNoticeItemDto {
	private String fcltNm; // 시설명 (예: 체크인카운터)
	private String fcltCd; // 시설 코드 (예: M11)
	private int boothCnt; // 조치 부스 수 — "n개 부스 OPEN"

	public MapNoticeItemDto withFcltNm(String fcltNm) {
		this.fcltNm = fcltNm;
		return this;
	}

	public MapNoticeItemDto withFcltCd(String fcltCd) {
		this.fcltCd = fcltCd;
		return this;
	}

	public MapNoticeItemDto withBoothCnt(int boothCnt) {
		this.boothCnt = boothCnt;
		return this;
	}
}
