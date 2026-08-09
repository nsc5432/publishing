package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 카드 1장 (= 도면 위 출국장 1곳).
 * 좌표는 마커와 같은 도면 무대 기준 <b>비율(%)</b> 이며 {@link aoms.pm.cast.domains.DepHallLayout} 이 준다.
 */
@Getter
@Setter
public class DepHallGateDto {
	private String depNum; // 출국장 번호
	private String depNm; // 표시명 (예: 출국장 3)
	private CongestionStatus cgnStatus; // 카드 상태 뱃지
	private double cdntX; // 카드 자리 — 가로 비율 0~100
	private double cdntY; // 카드 자리 — 세로 비율 0~100
	private int boothCnt; // 운영 중인 부스(검색대) 수
	private String oprBgnTime; // 운영 시작 HHmm
	private String oprEndTime; // 운영 종료 HHmm
	private String useYn; // N 이면 미운영
	private MapCgnStatDto stat; // 혼잡 현황 지표 4종
}
