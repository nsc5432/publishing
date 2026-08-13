package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시간대별 자원 운영 1시간분 — 자원 활용 차트의 막대 1개.
 *
 * 대기인원을 같은 행에 실어 보내므로 화면이 축 두 개(자원 · 대기인원)를 한 벌의 값으로
 * 그린다. 두 값을 따로 조회하면 같은 시각인데 근거가 어긋나기 시작한다.
 */
@Getter
@Setter
public class ChknCounterRsrcDto {
	private int hour; // 0~23
	private int counterCnt; // 그 시간에 열린 유인 카운터 (개)
	private int kioskCnt; // 그 시간에 열린 키오스크 (대)
	private int bagDropCnt; // 그 시간에 열린 셀프백드롭 (대)
	private int wtngPsgCnt; // 대기인원 (명) — 꺾은선
	private int prcsPsgCnt; // 처리인원 (명)
	private int utilRate; // 자원 활용률 (%) = 운영 카운터 / 전체 카운터

	public ChknCounterRsrcDto withHour(int hour) {
		this.hour = hour;
		return this;
	}
}
