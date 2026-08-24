package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FltPsgHourDto {
	private String bgnTime; // 구간 시작 HHmm
	private String endTime; // 구간 종료 HHmm
	private int adjRate; // 구간 수정 비율 (%)
	private int psgCnt; // 구간 여객수 (명)
}
