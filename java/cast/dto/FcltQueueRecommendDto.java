package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 목표 해소시간에 필요한 총 시설 수 */
@Getter
@Setter
public class FcltQueueRecommendDto {
	private int targetMin; // 목표 해소시간 (분)
	private Integer reqCnt; // 최종 총 소요 수량 (현재 운영분 포함, 개)
	private Integer extraCnt; // max(reqCnt - 현재 운영 수, 0)
	private Integer reduceCnt; // max(현재 운영 수 - reqCnt, 0)
	private Integer flowBasedReqCnt; // 유입/처리 차이 계산 기준 소요 수량. 평균 대기시간 목표에는 목표 인원이 없어 null
	private Integer stableMinCnt; // M/M/s 안정조건(rho < 1) 최소 수량. 기준시각부터 1시간 평균 유입 기준 참고값이며 추천 판정에는 쓰지 않는다
	private String stableAplyYn; // 지속 해소 조건으로 소요 수량이 목표 시간만 맞추는 최소 수량보다 늘었으면 Y
	private String capaAvlYn; // 소요 수량이 배정가능 최대수 이하면 Y. 최대수를 모르면 null
	private String goalMetYn; // 소요 수량을 다시 예측해 목표 시간 안에 해소되고 판정 구간 끝까지 유지되고 구간 끝 대기인원이 기준시각 이하면 Y. 검증할 수 없으면 null
	private QueueMetricDto reqMetric;
}
