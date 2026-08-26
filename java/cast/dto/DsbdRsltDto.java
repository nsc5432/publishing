package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시간대별 결과 1행
 */
@Getter
@Setter
public class DsbdRsltDto {
	private String time; // HHmm
	private int psgCnt; // 여객수 (명)
	private Integer wtngPsgCnt; // 실측 대기인원 (명)
	private int wtngHr; // 대기시간 (분)
	private int prcsPsgCnt; // 처리인원 (명)
	private int prcsHr; // 처리시간 (분)
	private int prcsRate; // 처리율 (%)
	private int fcstWtngPsgCnt; // 예측 대기인원 (명)
	private int lastWeekWtngPsgCnt; // 지난주 同요일 대기인원 (명)
}
