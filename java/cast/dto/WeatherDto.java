package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 기상정보
 */
@Getter
@Setter
public class WeatherDto {
	private String wthrCn; // 날씨내용
	private int maxTp; // 최대온도
	private int minTp; // 최소온도
	private int hmdtVl; // 습도값
	private int wsVl; // 풍속값
	private double rwyAtm; // 활주로대기압
}
