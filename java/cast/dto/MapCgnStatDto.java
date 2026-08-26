package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 혼잡 현황 지표 4종
 */
@Getter
@Setter
public class MapCgnStatDto {
	private int wtngPsgCnt; // 대기인원 (명)
	private int wtngHr; // 대기시간 (초)
	private int prcsPsgCnt; // 처리인원 (명)
	private int prcsHr; // 처리시간 (초)
}
