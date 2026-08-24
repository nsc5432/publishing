package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.enums.SmltType;

import lombok.Getter;
import lombok.Setter;

/** 이력 1건의 결과 보기 — 결과 조회 화면으로 넘길 조건 */
@Getter
@Setter
public class SmltExecDetailDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private SmltType smltType; // 표준(일일) / 사용자
	private String ymd; // 시뮬레이션 기준일자 yyyyMMdd
	private String tmnlId; // T1 / T2
	private String deptNm; // 부서 — 원천 미확보, 현재 ''
	private String userNm; // 성명 — 원천 미확보, 현재 ''
	private String smltFlfmtBgngDt; // 시작일시 yyyyMMddHHmmss
	private String smltFlfmtEndDt; // 종료일시 yyyyMMddHHmmss — 진행중이면 ''
	private int execMin; // 소요시간 (분)
	private SmltExecStatus smltFlfmtSttsCd; // 완료 / 진행중
}
