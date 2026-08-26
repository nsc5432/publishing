package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

/**
 * 시뮬레이션 수행 이력
 */
@Getter
@Setter
public class SmltExcnDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private int smltFlfmtSn; // 수행 일련번호
	private String tmnlId; // DB 터미널 코드 (P01/P03)
	private String smltType; // AUTO 일일 / USER 사용자
	private String smltFlfmtSttsCd; // RUNNING 진행중 / DONE 완료
	private String smltFlfmtBgngDt; // 수행 시작일시 yyyyMMddHHmmss
	private String smltFlfmtEndDt; // 수행 종료일시 yyyyMMddHHmmss
	private String excnYmd; // 시뮬레이션 기준일자 yyyyMMdd
	private int rowNum; // 목록 No
	private String rgtrId; // 등록자 ID
	private String deptNm; // 부서명
	private String userNm; // 성명
	private int execMin; // 소요시간 (분)
}
