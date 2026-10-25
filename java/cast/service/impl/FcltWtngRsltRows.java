package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;
import aoms.pm.cast.dto.FcltWtngRsltDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

/**
 * @Classname : FcltWtngRsltRows.java
 * @Description : 10분 대기 통계와 TN_PM_SMLT_FCLT_WTNG_RSLT 행 변환
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
final class FcltWtngRsltRows {
	private static final int PSEC_SCALE = 0;
	private static final long MAX_METRIC_VALUE = 999_999_999_999L;
	private static final BigDecimal MAX_METRIC_DECIMAL = BigDecimal.valueOf(MAX_METRIC_VALUE);
	private static final String YN_Y = "Y";
	private static final String YN_N = "N";

	private FcltWtngRsltRows() {
		throw new UnsupportedOperationException("FcltWtngRsltRows Class is Utility class.");
	}

	static List<FcltWtngRsltDto> toRowList(String smltId, int smltMdlSn, TerminalKind tmnlId, FcltType fcltType, Map<String, List<FcltWtngSec>> secMap) {
		List<FcltWtngRsltDto> result = new ArrayList<>();

		secMap.forEach((unitCd, secList) -> {
			for (FcltWtngSec sec : secList) {
				FcltWtngRsltDto row = new FcltWtngRsltDto();
				row.setSmltId(smltId);
				row.setSmltMdlSn(smltMdlSn);
				row.setTmnlId(tmnlId.getValue());
				row.setFcltTypeCd(fcltType.getValue());
				row.setFcltUnitCd(unitCd);
				row.setSecBgngDt(sec.getSecBgngDt());
				row.setEndWtngPsgCnt(sec.getEndWtngPsgCnt());
				row.setPrcsPsgCnt(sec.getPrcsPsgCnt());
				row.setWtngPsecSum(toPsec(sec.getWtngPsecSum(), unitCd, sec));
				row.setWtngVldPsgCnt(sec.getWtngVldPsgCnt());
				row.setPrcsPsecSum(toPsec(sec.getPrcsPsecSum(), unitCd, sec));
				row.setPrcsVldPsgCnt(sec.getPrcsVldPsgCnt());
				row.setWtngPsgCntSum(sec.getWtngPsgCntSum());
				row.setWtngNocs(sec.getWtngNocs());
				row.setMaxWtngPsgCnt(sec.getMaxWtngPsgCnt());
				row.setEndOperCntom(sec.getEndOperCntom());
				row.setPrcsCpct(sec.getPrcsCpct());
				row.setPrcsVldOperCntomSum(sec.getPrcsVldOperCntomSum());
				row.setObsrvnYn(sec.isObsrvn() ? YN_Y : YN_N);

				if (hasOutOfRangeMetric(row)) {
					throw new IllegalStateException("시설 수치가 NUMBER(12,0) 범위를 넘습니다. unitCd=" + unitCd + ", secBgngDt=" + sec.getSecBgngDt());
				}

				result.add(row);
			}
		});

		return result;
	}

	/** 행 자체가 잘못됐으면 사유. 정상이면 null */
	static String findInvalidRow(List<FcltWtngRsltDto> rowList) {
		for (FcltWtngRsltDto row : rowList) {
			if (row.getSecBgngDt() == null || !FcltWtngSecs.isSecBoundary(row.getSecBgngDt())) {
				return "10분 경계가 아닌 저장 행이 있습니다. unitCd=" + row.getFcltUnitCd() + ", secBgngDt=" + row.getSecBgngDt();
			}

			if (!YN_Y.equals(row.getObsrvnYn()) && !YN_N.equals(row.getObsrvnYn())) {
				return "관측여부가 Y / N 이 아닌 저장 행이 있습니다. unitCd=" + row.getFcltUnitCd() + ", secBgngDt=" + row.getSecBgngDt();
			}

			if (row.getWtngPsecSum() == null || row.getPrcsPsecSum() == null) {
				return "시간 합계가 비어 있는 저장 행이 있습니다. unitCd=" + row.getFcltUnitCd() + ", secBgngDt=" + row.getSecBgngDt();
			}

			if (row.getWtngPsecSum().stripTrailingZeros().scale() > PSEC_SCALE
					|| row.getPrcsPsecSum().stripTrailingZeros().scale() > PSEC_SCALE) {
				return "초단위 합계가 정수가 아닌 저장 행이 있습니다. unitCd=" + row.getFcltUnitCd() + ", secBgngDt=" + row.getSecBgngDt();
			}

			if (hasOutOfRangeMetric(row)) {
				return "시설 수치가 NUMBER(12,0) 범위를 넘는 저장 행이 있습니다. unitCd=" + row.getFcltUnitCd() + ", secBgngDt=" + row.getSecBgngDt();
			}
		}

		return null;
	}

	/** 시설별 시각순 10분 통계. findInvalidRow 를 통과한 행만 넘긴다 */
	static Map<String, List<FcltWtngSec>> toSecMap(List<FcltWtngRsltDto> rowList) {
		Map<String, List<FcltWtngSec>> result = new LinkedHashMap<>();

		for (FcltWtngRsltDto row : rowList) {
			result.computeIfAbsent(row.getFcltUnitCd(), ignored -> new ArrayList<>()).add(FcltWtngSec.builder()
					.unitCd(row.getFcltUnitCd())
					.secBgngDt(row.getSecBgngDt())
					.endWtngPsgCnt(row.getEndWtngPsgCnt())
					.prcsPsgCnt(row.getPrcsPsgCnt())
					.wtngPsecSum(row.getWtngPsecSum().doubleValue())
					.wtngVldPsgCnt(row.getWtngVldPsgCnt())
					.prcsPsecSum(row.getPrcsPsecSum().doubleValue())
					.prcsVldPsgCnt(row.getPrcsVldPsgCnt())
					.wtngPsgCntSum(row.getWtngPsgCntSum())
					.wtngNocs(row.getWtngNocs())
					.maxWtngPsgCnt(row.getMaxWtngPsgCnt())
					.endOperCntom(row.getEndOperCntom())
					.prcsCpct(row.getPrcsCpct())
					.prcsVldOperCntomSum(row.getPrcsVldOperCntomSum())
					.obsrvn(YN_Y.equals(row.getObsrvnYn()))
					.build());
		}

		return result;
	}

	private static boolean hasOutOfRangeMetric(FcltWtngRsltDto row) {
		return row.getWtngPsecSum().abs().compareTo(MAX_METRIC_DECIMAL) > 0
				|| row.getPrcsPsecSum().abs().compareTo(MAX_METRIC_DECIMAL) > 0
				|| isOutOfMetricRange(row.getWtngPsgCntSum())
				|| isOutOfMetricRange(row.getPrcsCpct())
				|| isOutOfMetricRange(row.getPrcsVldOperCntomSum());
	}

	private static boolean isOutOfMetricRange(Long value) {
		return value != null && (value < -MAX_METRIC_VALUE || value > MAX_METRIC_VALUE);
	}

	// NUMBER(12,0) 의 묵시적 반올림에 기대지 않는다
	private static BigDecimal toPsec(double value, String unitCd, FcltWtngSec sec) {
		if (!Double.isFinite(value) || BigDecimal.valueOf(value).stripTrailingZeros().scale() > PSEC_SCALE) {
			throw new IllegalStateException("초단위 합계는 유한한 정수여야 합니다. unitCd=" + unitCd
					+ ", secBgngDt=" + sec.getSecBgngDt() + ", value=" + value);
		}

		return BigDecimal.valueOf(value).setScale(PSEC_SCALE);
	}
}
