package aoms.pm.cast.domains;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.queue.CalculationMethod;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.dto.PsgPrcsGradeRawDto;
import aoms.pm.cast.enums.CongestionStatus;

/**
 * @Classname : CgnGradeScale.java
 * @Description : 시설 그룹별 혼잡등급 기준정보 — 대시보드 / 체크인 공용 Queue 가 함께 쓴다
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
	private static final List<CongestionStatus> SEVERITY_ORDER = CongestionStatus.getList();
	private static final int SEC_PER_MIN = 60;

	private final List<Band> bandList;
	private final int normalUpperExclusiveSec;

	public CgnGradeScale(String fcltGroupCd, List<PsgPrcsGradeRawDto> rawList, String context) {
		if (rawList == null || rawList.isEmpty()) {
			throw new IllegalStateException("혼잡등급 기준정보를 찾을 수 없습니다. " + context);
		}

		Map<String, Band> bandMap = new LinkedHashMap<>();

		for (PsgPrcsGradeRawDto grade : rawList) {
			String gradeCode = grade.getPsgPrcsGrdCd();

			if (!fcltGroupCd.equals(grade.getFcltGroupCd())) {
				throw new IllegalStateException("혼잡등급 시설 그룹이 일치하지 않습니다. " + context);
			}

			CongestionStatus status = CongestionStatus.ofGradeCode(gradeCode);
			validateRange(grade, context);

			if (bandMap.putIfAbsent(gradeCode, new Band(status, grade.getMinVl(), grade.getMaxVl())) != null) {
				throw new IllegalStateException("혼잡등급 기준정보가 중복되었습니다. " + context + ", psgPrcsGrdCd=" + gradeCode);
			}
		}

		if (bandMap.size() != SEVERITY_ORDER.size()) {
			throw new IllegalStateException("혼잡등급 기준정보는 " + SEVERITY_ORDER.size() + "개 등급이 모두 있어야 합니다. "
					+ context + ", psgPrcsGrdCdList=" + bandMap.keySet());
		}

		this.bandList = new ArrayList<>(bandMap.values());
		this.bandList.sort(Comparator.comparingInt(Band::getMinSec));

		validateContinuity(context);

		this.normalUpperExclusiveSec = bandMap.get(NORMAL_GRADE_CD).maxExclusiveSec;
	}

	/** 평균 대기시간(초, 소수 원값)의 등급. 올림/반올림한 표시값을 넘기지 않는다 */
	public Computed<CongestionStatus> gradeOf(Computed<Double> avgWtngSec) {
		if (!avgWtngSec.hasValue()) {
			return Computed.unavailable(CalculationMethod.CGN_GRADE, avgWtngSec.getReason());
		}

		double value = avgWtngSec.getValue();

		if (!Double.isFinite(value) || value < 0) {
			return Computed.unavailable(CalculationMethod.CGN_GRADE, "평균 대기시간이 0 이상의 유한한 값이 아닙니다. avgWtngSec=" + value);
		}

		for (Band band : bandList) {
			if (band.minSec <= value && value < band.maxExclusiveSec) {
				return Computed.calculated(band.status, CalculationMethod.CGN_GRADE,
						band.minSec + "초 이상 " + band.maxExclusiveSec + "초 미만 구간");
			}
		}

		return Computed.unavailable(CalculationMethod.CGN_GRADE, "평균 대기시간이 혼잡등급 기준 범위("
				+ bandList.get(bandList.size() - 1).maxExclusiveSec + "초 미만)를 벗어났습니다. avgWtngSec=" + value);
	}

	/** 혼잡해소 목표 — 평균 대기시간이 이 값(초) 미만이면 NORMAL 이하다 */
	public int getNormalUpperExclusiveSec() {
		return normalUpperExclusiveSec;
	}

	private void validateContinuity(String context) {
		for (int index = 0; index < bandList.size(); index++) {
			Band current = bandList.get(index);

			if (current.status != SEVERITY_ORDER.get(index)) {
				throw new IllegalStateException("혼잡등급 기준 구간의 순서가 등급 순서와 다릅니다. " + context
						+ ", position=" + index + ", status=" + current.status.getValue());
			}

			int expectedMinSec = index == 0 ? 0 : bandList.get(index - 1).maxExclusiveSec;

			if (current.minSec != expectedMinSec) {
				throw new IllegalStateException("혼잡등급 기준 구간에 공백이나 겹침이 있습니다. " + context
						+ ", status=" + current.status.getValue()
						+ ", minSec=" + current.minSec
						+ ", expectedMinSec=" + expectedMinSec);
			}
		}
	}

	private static void validateRange(PsgPrcsGradeRawDto grade, String context) {
		if (grade.getMinVl() < 0 || grade.getMaxVl() < 0 || grade.getMinVl() > grade.getMaxVl()) {
			throw new IllegalStateException("혼잡등급 기준 구간이 올바르지 않습니다. " + context
					+ ", psgPrcsGrdCd=" + grade.getPsgPrcsGrdCd()
					+ ", minVl=" + grade.getMinVl()
					+ ", maxVl=" + grade.getMaxVl());
		}
	}

	/** 기준표 1행을 초 단위 [minSec, maxExclusiveSec) 로 바꾼 구간. DB 의 19분은 19분 59.x초까지다 */
	private static final class Band {
		private final CongestionStatus status;
		private final int minSec;
		private final int maxExclusiveSec;

		private Band(CongestionStatus status, int minVl, int maxVl) {
			this.status = status;
			this.minSec = Math.multiplyExact(minVl, SEC_PER_MIN);
			this.maxExclusiveSec = Math.multiplyExact(Math.addExact(maxVl, 1), SEC_PER_MIN);
		}

		private int getMinSec() {
			return minSec;
		}
	}
}
