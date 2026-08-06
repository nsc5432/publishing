package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FltPsgRawDto {
	private String hour; // 예측시분(PREDC_HM)의 시 HH
	private int fltCnt; // 운항편 수
	private int psgCnt; // 여객수 (예약탑승객 - 예약환승객)
}
