package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

/**
 * 터미널 패널 요약
 */
@Getter
@Setter
public class TmnlSmryDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String tmnlId; // T1 / T2
	private int fltCnt; // 운항편
	private int fltDiffCnt; // 지난주 同요일 대비 운항편 증감
	private int yesterdayFltDiffCnt; // 전일 대비 운항편 증감
	private int psgCnt; // 여객
	private int psgDiffCnt; // 지난주 同요일 대비 여객 증감
	private int yesterdayPsgDiffCnt; // 전일 대비 여객 증감
	private int brdgRate; // 탑승률 (%)
	private CongestionStatus cgnStatus; // 패널 전체 혼잡도 — hhmm 의 체크인 / 출국장 시설 중 최고 등급. 전부 산정 불가면 null
	private Double cgnWtngSec; // cgnStatus 를 정한 시설의 직전 30분 처리 여객 평균 대기시간 (초, 소수 원값). 산정 불가면 null
	private int intrvlMin; // 구간 집계 길이 (분)
	private int intrvlFltCnt; // 구간 출발 운항편
	private int intrvlPsgCnt; // 구간 출발 여객
	private int intrvlYesterdayFltDiffCnt; // 전일 같은 구간 대비 운항편 증감
	private int intrvlYesterdayPsgDiffCnt; // 전일 같은 구간 대비 여객 증감
	private Integer intrvlMaxWtngPsgCnt;
	private Double intrvlAvgWtngSec;
	private Integer intrvlPrcsPsgCnt;
	private PeakDto peak; // 피크시간 지표
}
