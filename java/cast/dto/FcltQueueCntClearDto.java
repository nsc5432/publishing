package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

/** 혼잡해소 팝업 차트의 운영 수량 하나 — 해소 예상과 목표 충족 여부 */
@Getter
@Setter
public class FcltQueueCntClearDto {
	private Integer fcltCnt; // 운영 시설 수 (개)
	private Double cgnClearMin; // 혼잡해소 소요시간 (분, 반올림 전). 산정 불가 / 해소 불가면 null
	private String cgnClearDt; // 해소 예상 일시 yyyyMMddHHmmss. 없으면 ''
	private QueueMetricDto clearMetric;
	private String goalMetYn; // 추천 수량과 같은 판정 — 목표 시간 안에 해소되고 판정 구간(clearJudgeMin) 끝까지 유지 · 구간 끝 대기인원이 기준시각 이하
	private List<FcltQueueFcstDto> fcstList = new ArrayList<>(); // 기준시각부터 판정 구간 끝까지 10분 간격 예측
}
