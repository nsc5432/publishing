package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.SmltType;

import lombok.Getter;
import lombok.Setter;

/**
 * 조회 조건 기준 정보
 */
@Getter
@Setter
public class DsbdBaseInfoDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId; // 시뮬레이션 ID
	private String ymd; // 기준일자 yyyyMMdd
	private SmltType smltType; // 시뮬레이션 구분
	private String lastCalcDt; // 마지막 계산 시각 yyyyMMddHHmmss
	private String nextCalcDt; // 재계산 예정 시각 yyyyMMddHHmmss
	private List<String> avlTimes; // 선택 가능한 기준 시각 HHmm
}
