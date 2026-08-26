package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.enums.SmltType;

import lombok.Getter;
import lombok.Setter;

/**
 * 시뮬레이션 이력 1행
 */
@Getter
@Setter
public class SmltCastExecDto {
	private int rowNum; // No
	private String smltId; // 시뮬레이션 ID
	private SmltType smltType; // 표준(일일) / 사용자
	private String rgtrId; // 등록자 ID
	private String deptNm; // 부서
	private String userNm; // 성명
	private String smltFlfmtBgngDt; // 시작일시 yyyyMMddHHmmss
	private String smltFlfmtEndDt; // 종료일시 yyyyMMddHHmmss
	private int execMin; // 소요시간 (분)
	private SmltExecStatus smltFlfmtSttsCd; // 완료 / 진행중
}
