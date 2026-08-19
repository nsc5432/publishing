package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * TN_PM_PSG_WTNG_INFO(여객대기정보) 집계 1행 — Xovis 실측 대기인원의 조회 원형.
 *
 * <p>
 * 원천은 10분 간격 순간값이고, 시설 1개가 1행이다. 시설 구분은 FCLT_TYPE_CD 로 한다.
 * </p>
 *
 * <pre>
 * Queue 체크인 대기열  CHKN_ISL_CD = 아일랜드(E/K/M …)  FCLT_NM = 항공사(VJ_1 / UO / ZE-PRE …)
 * DG    출국장         CHKN_ISL_CD = 출국장번호(01~04)  FCLT_NM = DG1 / DG4_E / DG4_W
 * SC    보안검색대     CHKN_ISL_CD = 출국장번호(01~04)  FCLT_NM = T1_DG4_Lane03
 * </pre>
 */
@Getter
@Setter
public class PsgWtngRawDto {
	private String time; // 집계 시각 HHmm (정시)
	private int wtngPsgCnt; // 대기인원 (명) — 대기라인길이(WTNG_LINE_LEN)
}
