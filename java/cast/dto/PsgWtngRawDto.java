package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_PSG_WTNG_INFO(여객대기정보) 집계 1행
 */
@Getter
@Setter
public class PsgWtngRawDto {
	private String time; // 집계 시각 HHmm
	private int wtngPsgCnt; // 대기인원 (명)
}
