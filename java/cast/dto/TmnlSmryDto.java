package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 터미널 패널 요약.
 * 탑승률(brdgRate)은 원천 컬럼이 확인되지 않아 DB 모드에서는 0 이다 (결정 로그 D7).
 */
@Getter
@Setter
public class TmnlSmryDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private int fltCnt; // 운항편
	private int fltDiffCnt; // 지난주 同요일 대비 운항편 증감
	private int befFltDiffCnt; // 전일 대비 운항편 증감
	private int psgCnt; // 여객
	private int psgDiffCnt; // 지난주 同요일 대비 여객 증감
	private int befPsgDiffCnt; // 전일 대비 여객 증감
	private int brdgRate; // 탑승률 (%) — 원천 미확보, 항상 0
	private CongestionStatus cgnStatus; // 패널 전체 혼잡도
	private int itvlMin; // 구간 집계 길이 (분)
	private int itvlFltCnt; // 조회 시각 ~ +itvlMin 구간의 출발 운항편
	private int itvlPsgCnt; // 같은 구간의 출발 여객 (예약탑승객 - 예약환승객)
	private int itvlBefFltDiffCnt; // 전일 같은 구간 대비 운항편 증감
	private int itvlBefPsgDiffCnt; // 전일 같은 구간 대비 여객 증감
	private PeakDto peak; // 피크시간 지표
}
