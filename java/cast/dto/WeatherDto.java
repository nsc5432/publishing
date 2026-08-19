package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 상단 카드 — 기상정보.
 * GOOWN.TN_GO_WTHCN_INFO 는 하루 최대 2회(07/09시) 발표된다. 조회일의 가장 최근 발표 1건을 쓴다.
 */
@Getter
@Setter
public class WeatherDto {
	private String wthrCn; // 날씨내용 (예: 흐리고 비)
	private int maxTp; // 최대온도 ℃
	private int minTp; // 최소온도 ℃
	private int hmdtVl; // 습도값 %
	private int wsVl; // 풍속값 m/s
	private double rwyAtm; // 활주로대기압 hPa
}
