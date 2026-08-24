package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltExcnDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	// TH_PM_SMLT_FLFMT_HSTRY 컬럼 미러
	private String smltId;
	private int smltFlfmtSn; // 수행 일련번호
	private String tmnlId; // DB 터미널 코드 (P01/P03)
	private String smltType; // AUTO 일일 / USER 사용자
	private String smltFlfmtSttsCd; // RUNNING 진행중 / DONE 완료
	private String smltFlfmtBgngDt; // 수행 시작일시 yyyyMMddHHmmss
	private String smltFlfmtEndDt; // 수행 종료일시 yyyyMMddHHmmss — 진행중이면 ''

	// 이력 결과 보기에서 TN_PM_SMLT_STNG 을 조인해 채우는 컬럼
	private String excnYmd; // 시뮬레이션 기준일자 yyyyMMdd

	// 모니터링 목록에서만 채워지는 컬럼
	private int rowNum; // 목록 No
	private String rgtrId; // 등록자 ID (FRST_RGTR_ID)
	private String deptNm; // 부서명 — 사용자 테이블 미확인이라 현재는 '' (G1)
	private String userNm; // 성명 — 사용자 테이블 미확인이라 현재는 '' (G1)
	private int execMin; // 소요시간 (분)
}
