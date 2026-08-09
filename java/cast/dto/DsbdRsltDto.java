package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시간대별 결과 1행 — 터미널 패널의 차트 뷰와 테이블 뷰가 함께 쓴다.
 * 예측·지난주 비교선은 원천이 확인되지 않아 DB 모드에서는 0 이다 (결정 로그 D7).
 */
@Getter
@Setter
public class DsbdRsltDto {
	private String time; // HHmm
	private int psgCnt; // 여객수 (명)
	private int wtngPsgCnt; // 대기인원 (명)
	private int wtngHr; // 대기시간 (분)
	private int prcsPsgCnt; // 처리인원 (명)
	private int prcsHr; // 처리시간 (분)
	private int prcsRate; // 처리율 (%)
	private int fcstWtngPsgCnt; // 예측 대기인원 (차트 점선) — 원천 미확보, 항상 0
	private int lastWeekWtngPsgCnt; // 지난주 同요일 대기인원 (차트 비교선) — 원천 미확보, 항상 0
}
