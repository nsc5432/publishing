package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시뮬레이션 모니터링 3개 API 의 공용 조회 조건.
 * 화면의 시작/종료 일시를 합쳐 yyyyMMddHHmm 으로 받는다.
 */
@Getter
@Setter
public class MntrSearchDto {
	private String bgnDt; // 조회 시작 yyyyMMddHHmm
	private String endDt; // 조회 종료 yyyyMMddHHmm
	private String smltId; // 이력 결과 보기 대상
}
