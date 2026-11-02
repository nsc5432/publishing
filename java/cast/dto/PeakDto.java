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
	private int avgWtngHr; // 피크 시각 10분 구간 처리 여객의 처리인원 가중평균 대기시간 (분)
	private int prcsPsgCnt; // 피크 시각 10분 구간 처리인원 (명)
}
