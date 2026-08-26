package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 도면 마커
 */
@Getter
@Setter
public class MapMarkerDto {
	private String markerId; // 마커 식별자
	private String label; // 표시 문구
	private double cdntX; // 가로 비율 0~100
	private double cdntY; // 세로 비율 0~100

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
}
