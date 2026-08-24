package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 출국장 카드 1장 (= 도면 위 출국장 1곳) — 하루 내내 그대로인 부분.
 * 좌표는 마커와 같은 도면 무대 기준 <b>비율(%)</b> 이며 {@link aoms.pm.cast.domains.DepHallLayout} 이 준다.
 * 시각에 따라 움직이는 혼잡도 · 지표는 {@link DepHallSlotDto} 가 갖는다.
 */
@Getter
@Setter
public class DepHallGateDto {
	private String dptgtNo; // 출국장 번호
	private String dptgtNm; // 표시명 (예: 출국장 3)
	private double cdntX; // 카드 자리 — 가로 비율 0~100
	private double cdntY; // 카드 자리 — 세로 비율 0~100
	private int boothCnt; // 운영 중인 부스(검색대) 수
	private String oprBgnTime; // 운영 시작 HHmm
	private String oprEndTime; // 운영 종료 HHmm
	private String useYn; // N 이면 미운영
}
