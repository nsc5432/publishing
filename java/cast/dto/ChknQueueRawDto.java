package aoms.pm.cast.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/** 공용 Queue 계산 원천 — 30분으로 자르지 않은 부스별 결과 1행 */
@Getter
@Setter
public class ChknQueueRawDto {
	private LocalDateTime smltActlDt;
	private String psgFcltCd;
	private String island;
	private int wtngPsgCnt;
	private int trnstPsgCnt;
	private int wtngHr; // 평균대기시간 (초)
	private int prcsHr; // 평균처리시간 (초)
}
