package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 카드 1장
 */
@Getter
@Setter
public class DepHallGateDto {
	private String dptgtNo; // 출국장 번호
	private String dptgtNm; // 표시명
	private double cdntX; // 가로 비율 0~100
	private double cdntY; // 세로 비율 0~100
	private int boothCnt; // 운영 부스 수
	private String oprBgnTime; // 운영 시작 HHmm
	private String oprEndTime; // 운영 종료 HHmm
	private String useYn; // 사용여부
}
