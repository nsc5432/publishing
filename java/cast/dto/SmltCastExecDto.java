package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.enums.SmltType;

import lombok.Getter;
import lombok.Setter;

/**
 * 시뮬레이션 이력 1행.
 * 부서/성명은 사용자 테이블이 확인되지 않아(G1) 현재 '' 로 내려간다 — 조인 키가 될 rgtrId 는 함께 싣는다.
 */
@Getter
@Setter
public class SmltCastExecDto {
	private int rowNum; // No
	private String smltId; // 결과 보기에 쓰는 시뮬레이션 ID
	private SmltType smltType; // 표준(일일) / 사용자
	private String rgtrId; // 등록자 ID (FRST_RGTR_ID)
	private String deptNm; // 부서 — 원천 미확보, 현재 ''
	private String userNm; // 성명 — 원천 미확보, 현재 ''
	private String bgnDt; // 시작일시 yyyyMMddHHmmss
	private String endDt; // 종료일시 yyyyMMddHHmmss — 진행중이면 ''
	private int execMin; // 소요시간 (분)
	private SmltExecStatus execStatus; // 완료 / 진행중
}
