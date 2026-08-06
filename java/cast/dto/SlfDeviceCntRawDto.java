package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SlfType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SlfDeviceCntRawDto {
	private String island; // 아일랜드 문자
	private SlfType slfType; // KIOSK / SBD
	private int deviceCnt; // 대수
}
