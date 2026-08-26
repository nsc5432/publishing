package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시간대별 자원 운영 1시간분
 */
@Getter
@Setter
public class ChknCounterRsrcDto {
	private int hour; // 0~23
	private int counterCnt; // 유인 카운터 (개)
	private int kioskCnt; // 키오스크 (대)
	private int bagDropCnt; // 셀프백드롭 (대)
	private int wtngPsgCnt; // 대기인원 (명)
	private int prcsPsgCnt; // 처리인원 (명)
	private int utilRate; // 자원 활용률 (%)

	public ChknCounterRsrcDto withHour(int hour) {
		this.hour = hour;
		return this;
	}
}
