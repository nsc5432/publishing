package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상단 카드 — 기상정보.
 * 기상 원천 테이블이 확인되지 않아 DB 모드에서는 전 필드가 기본값이다 (결정 로그 D7).
 */
@Getter
@Setter
public class WeatherDto {
	private String wthrCd; // 날씨 코드 (아이콘 매핑)
	private int tmpr; // 기온 ℃
	private int rainAmt; // 강수량 mm
	private int snowAmt; // 적설 mm
	private String lowVisStep1Time; // 저시정 1단계 HHmm (없으면 '')
	private String lowVisStep2Time; // 저시정 2단계 HHmm (없으면 '')
}
