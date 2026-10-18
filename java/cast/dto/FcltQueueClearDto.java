package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 한 운영 수량 조건의 혼잡해소 예상(유입/처리 차이 계산)과 M/M/s 정상상태 참고지표 */
@Getter
@Setter
public class FcltQueueClearDto {
	private Integer fcltCnt; // 이 조건의 운영 시설 수 (개). 원천에 없으면 null
	private Double cgnClearMin; // 혼잡해소 소요시간 (분, 반올림 전). 산정 불가 / 해소 불가면 null
	private String cgnClearDt; // 해소 예상 일시 yyyyMMddHHmmss (기준시각 + 소요시간). 없으면 ''
	private QueueMetricDto clearMetric;
	private Double nextWtngSec; // 기준시각에 줄 선 여객의 예상 대기시간 (초) = (Q0+1)/(s×μ). 산정 불가 / 대기 끝나지 않음이면 null
	private QueueMetricDto nextWtngMetric;
	private Double wtngProb; // 대기 발생 확률 0~1
	private Double loadRatio; // 유입 부하 rho 0~1
	private Double thryWtngSec; // 이론 평균 대기시간 (초)
	private Double thryWtngPsgCnt; // 이론 시간평균 대기인원 (명)
	private QueueMetricDto erlangMetric;
}
