package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 상단 혼잡 알림 1건 */
@Getter
@Setter
public class MapNoticeItemDto {
	private String fcltNm; // 시설명 (예: 체크인카운터)
	private String fcltCd; // 시설 코드 (예: M11)
	private int boothCnt; // 조치 부스 수
	private Integer reqCnt; // 총 소요 부스 수 — 산정 불가면 null
	private Integer cgnClearMin; // NORMAL 도달 예상 분 — 산정 불가면 null

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

	public MapNoticeItemDto withReqCnt(Integer reqCnt) {
		this.reqCnt = reqCnt;
		return this;
	}

	public MapNoticeItemDto withCgnClearMin(Integer cgnClearMin) {
		this.cgnClearMin = cgnClearMin;
		return this;
	}
}
