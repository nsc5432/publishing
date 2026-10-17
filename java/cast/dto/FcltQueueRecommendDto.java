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
	private Integer fluidReqCnt; // 유입/처리 차이 계산 기준 소요 수량
	private Integer stableMinCnt; // M/M/s 안정조건(rho < 1) 최소 수량
	private String stableAplyYn; // 안정조건 하한으로 소요 수량이 늘었으면 Y
	private String capaAvlYn; // 소요 수량이 배정가능 최대수 이하면 Y. 최대수를 모르면 null
	private String goalMetYn; // 소요 수량의 해소시간이 목표 이내면 Y. 검증할 수 없으면 null
	private QueueMetricDto reqMetric;
}
