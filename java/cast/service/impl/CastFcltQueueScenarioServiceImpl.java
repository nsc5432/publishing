package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.dsbd.DepQueueWindow;
import aoms.pm.cast.domains.dsbd.FcltQueueClearance;
import aoms.pm.cast.domains.dsbd.FcltQueueSource;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.ErlangCResult;
import aoms.pm.cast.dto.FcltQueueClearDto;
import aoms.pm.cast.dto.FcltQueueRecommendDto;
import aoms.pm.cast.dto.FcltQueueScenarioDto;
import aoms.pm.cast.dto.FcltQueueScenarioSearchDto;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.QueueMetricDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.FcltQueueScenarioMode;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.service.CastCgnGradeService;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastDepQueueService;
import aoms.pm.cast.service.CastFcltQueueScenarioService;
import aoms.pm.cast.service.CastSmltService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastFcltQueueScenarioServiceImpl.java
 * @Description : 요약보기 시설 카드 혼잡해소 시나리오 팝업 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 13. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CastFcltQueueScenarioServiceImpl implements CastFcltQueueScenarioService {
	private static final String EMPTY = "";
	private static final int OBS_MIN = 30; // 관측구간 길이(분)
	private static final int MIN_PER_HOUR = 60; // 1시간 = 60분
	private static final double SEC_PER_MIN = 60.0; // 1분 = 60초

    // 목표 해소시간
	private static final int DFLT_TARGET_MIN = FcltQueueClearance.DFLT_TARGET_MIN; // 목표 해소시간 기본값(분)
	private static final int MIN_TARGET_MIN = 1; // 목표 해소시간 최솟값(분)
	private static final int MAX_TARGET_MIN = 120; // 목표 해소시간 최댓값(분)

	private static final List<String> CHKN_QUEUE_FCLT_CD_LIST = List.of("CC");
	private static final List<String> DEP_MAX_FCLT_CD_LIST = List.of("SC");

	private static final List<String> COMMON_ASMP_LIST = List.of(
			"M/M/s 적용 가정: 포아송 도착 / 지수 처리시간 / 동일 처리율의 병렬 시설 / 공용 대기열 선착순 / 무한 대기공간 / 이탈 없음 (통계 검증 아님)",
			"예측 구간 동안 유입률 / 처리율이 일정하고 시설 수는 즉시 바뀐다고 본다",
			"유입률은 관측구간 인원 보존식(종료 대기 - 시작 대기 + 서비스 시작)으로 역산한다");

	private static final List<String> CHKN_ASMP_LIST = List.of(
			"아일랜드 유인 카운터(CC) 공용 Queue — 부스별 결과를 재구성한 값",
			"운영 부스 수는 관측구간 마지막 분의 배정 부스, 처리율은 같은 구간의 부스/분당 처리용량 평균",
			"배정 가능 최대 수량은 시설 마스터의 아일랜드 CC 수");

	private static final List<String> DEP_ASMP_LIST = List.of(
			"SC / SR 결과를 합산한 하나의 보안검색 Queue (요약보기 카드 추천과 같은 구성, 직렬 / 병렬 관계 미검증)",
			"통과여객수를 서비스 시작인원으로 근사한다 (처리 중 인원 변화 무시)",
			"CAST 10분 결과의 대기여객수를 결과 시각의 스냅샷으로 본다",
			"운영 수량은 실행 리소스 보안검색 운영표의 FCLTY_CNT, 최대 수량은 시설 마스터 SC 수");

	private final CastDsbdMapper castDsbdMapper;
	private final CastSmltService castSmltService;
	private final CastChknQueueService castChknQueueService;
	private final CastDepQueueService castDepQueueService;
	private final CastCgnGradeService castCgnGradeService;

	@Override
	public FcltQueueScenarioDto retrieveFcltQueueScenario(FcltQueueScenarioSearchDto searchDto) {
		String invalid = validate(searchDto);

		if (invalid != null) {
			return fail(invalid);
		}

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		String unitCd = searchDto.getUnitCd();
		String context = context(searchDto, unitCd);
		FcltQueueSource source = searchDto.getFcltType() == FcltType.CHKN
				? getChknSource(smltStng, searchDto.getTmnlId(), searchDto.getHhmm(), unitCd)
				: getDepSource(smltStng, searchDto.getTmnlId(), searchDto.getHhmm(), unitCd);

		if (source == null) {
			return fail("선택한 시설의 시뮬레이션 결과를 찾을 수 없습니다. " + context);
		}

		int targetQueueCnt;

		try {
			CgnGradeScale gradeScale = castCgnGradeService.retrieveGradeScale(searchDto.getFcltType(), context);
			targetQueueCnt = FcltQueueClearance.toTargetQueueCnt(gradeScale.getNormalMax());
		} catch (IllegalStateException exception) {
			return fail(exception.getMessage());
		}

		FcltQueueClearance clearance = new FcltQueueClearance(source, targetQueueCnt);

		FcltQueueScenarioDto result = toBaseResult(searchDto, unitCd, clearance);
		result.setCurrent(toClear(clearance.clearOf(source.getOprCnt())));

		if (searchDto.getMode() == FcltQueueScenarioMode.COUNT) {
			Integer count = searchDto.getOprFcltCnt() == null ? source.getOprCnt() : searchDto.getOprFcltCnt().intValueExact();
			String countInvalid = searchDto.getOprFcltCnt() == null ? null : validateCount(count, source);

			if (countInvalid != null) {
				return fail(countInvalid);
			}

			result.setScenario(toClear(clearance.clearOf(count)));
			return result;
		}

		int targetMin = searchDto.getTargetMinutes() == null ? DFLT_TARGET_MIN : searchDto.getTargetMinutes().intValueExact();
		applyRecommend(result, clearance, targetMin);

		return result;
	}

	private String validate(FcltQueueScenarioSearchDto searchDto) {
		BigDecimal count = searchDto.getOprFcltCnt();

		if (searchDto.getMode() == FcltQueueScenarioMode.COUNT && count != null
				&& (!isInteger(count) || count.signum() < 0 || count.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0)) {
			return "시설 수는 0 이상의 정수여야 합니다.";
		}

		BigDecimal targetMinutes = searchDto.getTargetMinutes();

		if (searchDto.getMode() == FcltQueueScenarioMode.TIME && targetMinutes != null
				&& (!isInteger(targetMinutes)
						|| targetMinutes.compareTo(BigDecimal.valueOf(MIN_TARGET_MIN)) < 0
						|| targetMinutes.compareTo(BigDecimal.valueOf(MAX_TARGET_MIN)) > 0)) {
			return "목표 해소시간은 " + MIN_TARGET_MIN + "~" + MAX_TARGET_MIN + "분 사이의 정수여야 합니다.";
		}

		return null;
	}

	private String validateCount(Integer count, FcltQueueSource source) {
		Integer totCnt = source.getTotCnt();

		if (totCnt == null) {
			return Objects.equals(count, source.getOprCnt())
					? null
					: "배정 가능한 최대 수량이 확인되지 않아 시설 수를 조정할 수 없습니다.";
		}

		return count > totCnt ? "배정 가능한 최대 수량(" + totCnt + "개)을 넘었습니다." : null;
	}

	private FcltQueueSource getChknSource(SmltStngDto smltStng, TerminalKind tmnlId, String hhmm, String unitCd) {
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltStng.getSmltId(), tmnlId, smltStng.getExcnYmd());
		FcltQueueSource source = queueDay.sourceOf(unitCd, toMinutes(hhmm), OBS_MIN);

		if (source == null) {
			return null;
		}

		MaxCount maxCount = toMaxCount(source.getOprCnt(), getMasterCnt(tmnlId, unitCd, CHKN_QUEUE_FCLT_CD_LIST), "체크인카운터(CC)");

		return source.toBuilder()
				.totCnt(maxCount.value)
				.totCntRsn(maxCount.reason)
				.asmpList(CHKN_ASMP_LIST)
				.build();
	}

	private FcltQueueSource getDepSource(SmltStngDto smltStng, TerminalKind tmnlId, String hhmm, String unitCd) {
		DepQueueWindow window = castDepQueueService.retrieveDepQueueWindow(smltStng, tmnlId, hhmm);
		Integer masterCnt = getMasterCnt(tmnlId, unitCd, DEP_MAX_FCLT_CD_LIST);

		if (!window.hasResult(unitCd) && masterCnt == null) {
			return null;
		}

		FcltQueueSource source = window.sourceOf(unitCd);
		MaxCount maxCount = toMaxCount(source.getOprCnt(), masterCnt, "보안검색대(SC)");

		return source.toBuilder()
				.totCnt(maxCount.value)
				.totCntRsn(maxCount.reason)
				.asmpList(DEP_ASMP_LIST)
				.build();
	}

	private Integer getMasterCnt(TerminalKind tmnlId, String unitCd, List<String> upPsgFcltCdList) {
		return castDsbdMapper.retrieveFcltUnitList(tmnlId.getFcltTmnlId(), upPsgFcltCdList).stream()
				.filter(unit -> unitCd.equals(normalizeUnitCd(unit.getUnitCd())))
				.map(FcltUnitRawDto::getTotCnt)
				.findFirst()
				.orElse(null);
	}

	private MaxCount toMaxCount(Integer oprCnt, Integer masterCnt, String fcltLabel) {
		if (masterCnt == null) {
			return new MaxCount(null, fcltLabel + " 시설 마스터에서 배정 가능 수량을 찾지 못했습니다.");
		}

		if (oprCnt != null && oprCnt > masterCnt) {
			return new MaxCount(null, "운영 수량(" + oprCnt + "개)이 시설 마스터 수량(" + masterCnt + "개)보다 많아 배정 가능 최대 수량을 확정할 수 없습니다.");
		}

		return new MaxCount(masterCnt, EMPTY);
	}

	private FcltQueueClearDto toClear(FcltQueueClearance.ClearanceResult clear) {
		Computed<Double> clearSec = clear.getClearSec();
		Computed<Double> nextWtng = clear.getNextWtngSec();
		Computed<ErlangCResult> erlang = clear.getErlang();

		FcltQueueClearDto result = new FcltQueueClearDto();
		result.setFcltCnt(clear.getServerCnt());
		result.setCgnClearMin(clearSec.hasValue() ? clearSec.getValue() / SEC_PER_MIN : null);
		result.setCgnClearDt(clear.getClearDt() == null ? EMPTY : formatDt(clear.getClearDt()));
		result.setClearMetric(QueueMetricDto.of(clearSec));
		result.setNextWtngSec(nextWtng.hasValue() ? nextWtng.getValue() : null);
		result.setNextWtngMetric(QueueMetricDto.of(nextWtng));
		result.setErlangMetric(QueueMetricDto.of(erlang));

		if (erlang.hasValue()) {
			ErlangCResult value = erlang.getValue();
			result.setWtngProb(value.getWaitProbability());
			result.setLoadRatio(value.getLoadRatio());
			result.setThryWtngSec(value.getModelAvgWtngTimeSec());
			result.setThryWtngPsgCnt(value.getModelAvgQueuePsgCnt());
		}

		return result;
	}

	private void applyRecommend(FcltQueueScenarioDto result, FcltQueueClearance clearance, int targetMin) {
		Integer currentCnt = clearance.getSource().getOprCnt();
		Integer totCnt = clearance.getSource().getTotCnt();
		FcltQueueClearance.Recommend calculated = clearance.recommendOf(targetMin);
		Computed<Integer> flowBasedReqCnt = calculated.getFlowBasedReqCnt();

		FcltQueueRecommendDto recommend = new FcltQueueRecommendDto();
		recommend.setTargetMin(targetMin);
		recommend.setReqMetric(QueueMetricDto.of(flowBasedReqCnt));
		recommend.setFlowBasedReqCnt(flowBasedReqCnt.hasValue() ? flowBasedReqCnt.getValue() : null);
		recommend.setStableMinCnt(calculated.getStableMinCnt());
		result.setRecommend(recommend);

		Integer reqCnt = calculated.getReqCnt();

		if (reqCnt == null) {
			return;
		}

		recommend.setReqCnt(reqCnt);
		recommend.setStableAplyYn(reqCnt > flowBasedReqCnt.getValue() ? "Y" : "N");

		if (currentCnt != null) {
			recommend.setExtraCnt(Math.max(reqCnt - currentCnt, 0));
			recommend.setReduceCnt(Math.max(currentCnt - reqCnt, 0));
		}

		recommend.setCapaAvlYn(totCnt == null ? null : reqCnt <= totCnt ? "Y" : "N");

		// 카드는 보유 수량을 넘어도 추천 수량 가정값을 그리지만, 팝업은 최대수 전량 배정 결과를 따로 보여준다
		if (totCnt != null && reqCnt > totCnt) {
			result.setTotScenario(toClear(clearance.clearOf(totCnt)));
			return;
		}

		recommend.setGoalMetYn(calculated.getGoalMet() == null ? null : calculated.getGoalMet() ? "Y" : "N");
		result.setScenario(toClear(calculated.getReqClear()));
	}

	private FcltQueueScenarioDto toBaseResult(FcltQueueScenarioSearchDto searchDto, String unitCd, FcltQueueClearance clearance) {
		FcltQueueSource source = clearance.getSource();
		Computed<Double> arrival = clearance.getArrival();
		Computed<Double> service = clearance.getService();
		List<String> asmpList = new ArrayList<>(COMMON_ASMP_LIST);
		asmpList.addAll(source.getAsmpList());

		FcltQueueScenarioDto result = new FcltQueueScenarioDto();
		result.setTmnlId(searchDto.getTmnlId());
		result.setFcltType(searchDto.getFcltType());
		result.setUnitCd(unitCd);
		result.setFcltNm(source.getFcltNm());
		result.setMode(searchDto.getMode());
		result.setBaseDt(formatDt(source.getObsEndDt()));
		result.setObsBgnDt(formatDt(source.getObsBgnDt()));
		result.setObsEndDt(formatDt(source.getObsEndDt()));
		result.setDataSrc(source.getDataSrc().name());
		result.setWtngPsgCnt(source.getQueueAtEnd());
		result.setTargetQueueCnt(clearance.getTargetQueueCnt());
		result.setOprFcltCnt(source.getOprCnt());
		result.setTotCnt(source.getTotCnt());
		result.setTotCntRsn(source.getTotCntRsn());
		result.setArvlRate(arrival.hasValue() ? arrival.getValue() / MIN_PER_HOUR : null);
		result.setSrvcRate(service.hasValue() ? service.getValue() / MIN_PER_HOUR : null);
		result.setArvlMetric(QueueMetricDto.of(arrival));
		result.setSrvcMetric(QueueMetricDto.of(service));
		result.setDfltTargetMin(DFLT_TARGET_MIN);
		result.setMinTargetMin(MIN_TARGET_MIN);
		result.setMaxTargetMin(MAX_TARGET_MIN);
		result.setAsmpList(asmpList);

		return result;
	}

	private FcltQueueScenarioDto fail(String message) {
		return (FcltQueueScenarioDto) new FcltQueueScenarioDto().error(message);
	}

	private boolean isInteger(BigDecimal value) {
		return value.signum() == 0 || value.stripTrailingZeros().scale() <= 0;
	}

	private String normalizeUnitCd(String unitCd) {
		return unitCd != null ? unitCd.trim() : EMPTY;
	}

	private String context(FcltQueueScenarioSearchDto searchDto, String unitCd) {
		return "smltId=" + searchDto.getSmltId()
				+ ", tmnlId=" + searchDto.getTmnlId().getValue()
				+ ", hhmm=" + searchDto.getHhmm()
				+ ", fcltType=" + searchDto.getFcltType().getValue()
				+ ", unitCd=" + unitCd;
	}

	private int toMinutes(String hhmm) {
		return Integer.parseInt(hhmm.substring(0, 2)) * MIN_PER_HOUR + Integer.parseInt(hhmm.substring(2, 4));
	}

	private String formatDt(LocalDateTime dateTime) {
		return dateTime.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
	}

	private static final class MaxCount {
		private final Integer value;
		private final String reason;

		private MaxCount(Integer value, String reason) {
			this.value = value;
			this.reason = reason;
		}
	}
}
