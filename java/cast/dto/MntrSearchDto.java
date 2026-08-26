package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시뮬레이션 모니터링 공용 조회 조건
 */
@Getter
@Setter
public class MntrSearchDto {
	private String bgnDt; // 조회 시작 yyyyMMddHHmm
	private String endDt; // 조회 종료 yyyyMMddHHmm
	private String smltId; // 시뮬레이션 ID
}
