package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 혼잡 현황 지표 4종 — 아일랜드 상세 / 출국장 미니 팝업 공용.
 * 시간 단위는 <b>초</b> 다 (대시보드 KPI 는 분이라 단위가 다르다).
 */
@Getter
@Setter
public class MapCgnStatDto {
	private int wtngPsgCnt; // 대기인원 (명)
	private int wtngHr; // 대기시간 (초)
	private int prcsPsgCnt; // 처리인원 (명)
	private int prcsHr; // 처리시간 (초)
}
