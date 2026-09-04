package aoms.pm.cast.domains;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.PsgPrcsGradeRawDto;
import aoms.pm.cast.enums.CongestionStatus;

/**
 * @Classname : CgnGradeScale.java
 * @Description : 시설 그룹별 혼잡등급 기준정보 — 대시보드 · 체크인 공용 Queue 가 함께 쓴다
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 04. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class CgnGradeScale {
	private static final String NORMAL_GRADE_CD = "02";

	private final List<PsgPrcsGradeRawDto> gradeList;
	private final BigDecimal normalMax;

	public CgnGradeScale(String fcltGroupCd, List<PsgPrcsGradeRawDto> rawList, String context) {
		if (rawList == null || rawList.isEmpty()) {
			throw new IllegalStateException("혼잡등급 기준정보를 찾을 수 없습니다. " + context);
		}

		Map<String, PsgPrcsGradeRawDto> gradeMap = new LinkedHashMap<>();

		for (PsgPrcsGradeRawDto grade : rawList) {
			String gradeCode = grade.getPsgPrcsGrdCd();

			if (!fcltGroupCd.equals(grade.getFcltGroupCd())) {
				throw new IllegalStateException("혼잡등급 시설 그룹이 일치하지 않습니다. " + context);
			}

			if (gradeMap.putIfAbsent(gradeCode, grade) != null) {
				throw new IllegalStateException("혼잡등급 기준정보가 중복되었습니다. " + context + ", psgPrcsGrdCd=" + gradeCode);
			}

			try {
				CongestionStatus.ofGradeCode(gradeCode);
			} catch (RuntimeException exception) {
				throw new IllegalStateException("혼잡등급 코드가 올바르지 않습니다. " + context + ", psgPrcsGrdCd=" + gradeCode, exception);
			}

			validateRange(grade, context);
		}

		PsgPrcsGradeRawDto normal = gradeMap.get(NORMAL_GRADE_CD);

		if (normal == null) {
			throw new IllegalStateException("NORMAL 혼잡등급 기준정보를 찾을 수 없습니다. " + context + ", psgPrcsGrdCd=" + NORMAL_GRADE_CD);
		}

		this.gradeList = new ArrayList<>(rawList);
		this.gradeList.sort(Comparator.comparing(PsgPrcsGradeRawDto::getMinVl));

		for (int index = 1; index < gradeList.size(); index++) {
			PsgPrcsGradeRawDto previous = gradeList.get(index - 1);
			PsgPrcsGradeRawDto current = gradeList.get(index);

			if (current.getMinVl().compareTo(previous.getMaxVl()) <= 0) {
				throw new IllegalStateException("혼잡등급 기준 구간이 겹칩니다. " + context
						+ ", previousGrade=" + previous.getPsgPrcsGrdCd()
						+ ", currentGrade=" + current.getPsgPrcsGrdCd());
			}
		}

		this.normalMax = normal.getMaxVl();
	}

	public CongestionStatus statusOf(int waitingCount, String context) {
		BigDecimal value = BigDecimal.valueOf(waitingCount);

		for (PsgPrcsGradeRawDto grade : gradeList) {
			if (value.compareTo(grade.getMinVl()) >= 0 && value.compareTo(grade.getMaxVl()) <= 0) {
				return CongestionStatus.ofGradeCode(grade.getPsgPrcsGrdCd());
			}
		}

		throw new IllegalStateException("대기인원에 해당하는 혼잡등급 기준정보를 찾을 수 없습니다. "
				+ context + ", waitingCount=" + waitingCount);
	}

	public BigDecimal getNormalMax() {
		return normalMax;
	}

	private static void validateRange(PsgPrcsGradeRawDto grade, String context) {
		if (grade.getMinVl() == null
				|| grade.getMaxVl() == null
				|| grade.getMinVl().signum() < 0
				|| grade.getMaxVl().signum() < 0
				|| grade.getMinVl().compareTo(grade.getMaxVl()) > 0) {
			throw new IllegalStateException("혼잡등급 기준 구간이 올바르지 않습니다. " + context
					+ ", psgPrcsGrdCd=" + grade.getPsgPrcsGrdCd()
					+ ", minVl=" + grade.getMinVl()
					+ ", maxVl=" + grade.getMaxVl());
		}
	}
}
