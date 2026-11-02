package aoms.pm.cast.domains.wtng;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Classname : FcltWtngIntrvl.java
 * @Description : 시설유형 전체(체크인 아일랜드 전체 / 출국장 전체)의 [bgnDt, endDt) 구간 대기 집계 — 요약보기 요약정보
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 11. 01. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Getter
@AllArgsConstructor
public final class FcltWtngIntrvl {
	/** 구간 시작 시각의 대기인원 합 — 각 시설 [bgnDt-10분, bgnDt) 행의 종료 대기인원 */
	private final Integer wtngPsgCnt;
	private final Integer arvlPsgCnt;
	private final Integer prcsPsgCnt;
	/** 구간 시작 시각 결과([bgnDt-10분, bgnDt) 행) 처리 여객의 대기시간 합 (초). 산정할 수 없으면 null */
	private final Double wtngSecSum;
	/** wtngSecSum 의 처리인원. wtngSecSum 이 null 이면 null */
	private final Integer wtngPrcsPsgCnt;

	// 피크시간과 같은 정의 — 아일랜드 · 출국장 처리 여객을 한데 모은 처리인원 가중평균이다
	public static FcltWtngIntrvl landsideOf(FcltWtngIntrvl chkn, FcltWtngIntrvl dep) {
		return new FcltWtngIntrvl(
				sumOrNull(chkn.getWtngPsgCnt(), dep.getWtngPsgCnt()),
				chkn.getArvlPsgCnt(),
				dep.getPrcsPsgCnt(),
				sumOrNull(chkn.getWtngSecSum(), dep.getWtngSecSum()),
				sumOrNull(chkn.getWtngPrcsPsgCnt(), dep.getWtngPrcsPsgCnt()));
	}

	/** 구간 시작 시각 결과 처리 여객의 처리인원 가중평균 대기시간 (초) */
	public Double getAvgWtngSec() {
		return wtngSecSum == null || wtngPrcsPsgCnt == null || wtngPrcsPsgCnt == 0 ? null : wtngSecSum / wtngPrcsPsgCnt;
	}

	private static Integer sumOrNull(Integer first, Integer second) {
		if (first == null || second == null) {
			return first == null ? second : first;
		}

		return first + second;
	}

	private static Double sumOrNull(Double first, Double second) {
		if (first == null || second == null) {
			return first == null ? second : first;
		}

		return first + second;
	}
}
