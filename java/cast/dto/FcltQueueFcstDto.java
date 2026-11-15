package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 혼잡해소 팝업 시간축 차트의 한 시각 — 운영 수량 하나의 예측 */
@Getter
@Setter
public class FcltQueueFcstDto {
	private String fcstDt; // 예측 시각 yyyyMMddHHmmss
	private Double fcstWtngSec; // 그 시각 직전 10분 처리 여객 예측 평균 대기시간 (초). 처리 여객이 없으면 null
	private Double wtngPsgCnt; // 그 시각 예측 대기인원 (명, 반올림 전)
}
