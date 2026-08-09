package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 도면 마커 1개.
 * 좌표는 도면 무대 기준 <b>비율(%)</b> 이다 — 픽셀이 아니다.
 * 좌표를 담은 테이블이 확인되지 않아(G1) 현재는 도면 배치 상수에서 채운다.
 */
@Getter
@Setter
public class MapMarkerDto {
	private String markerId; // 마커 식별자 (예: dg3, M, g14)
	private String label; // 표시 문구
	private double cdntX; // 가로 비율 0~100
	private double cdntY; // 세로 비율 0~100
	private CongestionStatus cgnStatus; // 마커 색상. 출입구 게이트는 null

	public MapMarkerDto withMarkerId(String markerId) {
		this.markerId = markerId;
		return this;
	}

	public MapMarkerDto withLabel(String label) {
		this.label = label;
		return this;
	}

	public MapMarkerDto withCdntX(double cdntX) {
		this.cdntX = cdntX;
		return this;
	}

	public MapMarkerDto withCdntY(double cdntY) {
		this.cdntY = cdntY;
		return this;
	}

	public MapMarkerDto withCgnStatus(CongestionStatus cgnStatus) {
		this.cgnStatus = cgnStatus;
		return this;
	}
}
