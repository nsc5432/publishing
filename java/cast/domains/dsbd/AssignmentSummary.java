package aoms.pm.cast.domains.dsbd;

/**
 * @Classname : AssignmentSummary.java
 * @Description : 체크인 아일랜드 1곳의 대표 항공사 배정 (배정 카운터가 가장 많은 항공사)
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 03. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class AssignmentSummary {
	private final String alnCd;
	private final String alnNm;
	private final int assignedCount;

	public AssignmentSummary(String alnCd, String alnNm, int assignedCount) {
		this.alnCd = alnCd;
		this.alnNm = alnNm;
		this.assignedCount = assignedCount;
	}

	public String getAlnCd() {
		return alnCd;
	}

	public String getAlnNm() {
		return alnNm;
	}

	public int getAssignedCount() {
		return assignedCount;
	}
}
