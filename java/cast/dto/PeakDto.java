package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 터미널 요약의 피크시간 지표 */
@Getter
@Setter
public class PeakDto {
	private String ampm; // AM / PM
	private String peakTime; // 피크 시각 HHmm
	private int wtngPsgCnt; // 총 대기인원 (명)
	private int maxWtngHr; // 최대 대기시간 (분)
	private int hrlyPrcsPsgCnt; // 시간당 처리인원 (명)
}
