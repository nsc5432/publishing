package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 혼잡 현황 지표 4종의 터미널 비교 기준 (같은 슬롯 [hhmm, hhmm+30))
 * 평균은 운영 부스 0 이고 처리 0 인 시설을 뺀다. 평균에 넣을 시설이 없으면 null
 */
@Getter
@Setter
public class MapCgnCmprDto {
	private int unitCnt; // 평균에 넣은 시설 수
	private int totWtngPsgCnt; // 전 시설 대기인원 합 (명)
	private Double avgPrcsPsgCnt; // 시설당 평균 처리인원 (명)
	private Double avgWtngHr; // 처리인원 가중평균 대기시간 (초)
	private Double avgPrcsHr; // 처리인원 가중평균 처리시간 (초)
}
