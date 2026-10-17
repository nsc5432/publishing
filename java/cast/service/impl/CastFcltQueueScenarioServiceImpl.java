package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.TreeMap;
import java.util.function.ToLongFunction;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueSlot;
import aoms.pm.cast.domains.dsbd.FcltQueueSource;
import aoms.pm.cast.domains.queue.ErlangCResult;
import aoms.pm.cast.domains.queue.FacilityQueueInput;
import aoms.pm.cast.domains.queue.FacilityQueueCalculator;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.QueueDataSource;
import aoms.pm.cast.dto.FcltQueueClearDto;
import aoms.pm.cast.dto.FcltQueueRecommendDto;
import aoms.pm.cast.dto.FcltQueueScenarioDto;
import aoms.pm.cast.dto.FcltQueueScenarioSearchDto;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.QueueMetricDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.FcltQueueScenarioMode;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.service.CastCgnGradeService;
import aoms.pm.cast.service.CastChknQueueService;
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
	private static final int CAST_SLOT_MIN = 10; // CAST 결과 구간(INTERVAL) 길이(분)
	private static final int MIN_PER_HOUR = 60; // 1시간 = 60분
	private static final int MIN_PER_DAY = 24 * MIN_PER_HOUR; // 하루 = 1440분
	private static final double SEC_PER_MIN = 60.0; // 1분 = 60초
	private static final double MAX_CLEAR_SEC = MIN_PER_DAY * SEC_PER_MIN; // 혼잡해소 시각으로 표기할 상한(초) = 하루(86400초), 넘으면 빈 값

    // 목표 해소시간
	private static final int DFLT_TARGET_MIN = 30; // 목표 해소시간 기본값(분)
	private static final int MIN_TARGET_MIN = 1; // 목표 해소시간 최솟값(분)
	private static final int MAX_TARGET_MIN = 120; // 목표 해소시간 최댓값(분)

	// lambda/mu 가 정수인데 부동소수 오차로 n - 1e-12 가 되면 rho = 1 인 수량을 안정 최소로 고르게 된다
	private static final double RHO_EPSILON = 1e-9;
	private static final double GOAL_EPSILON_SEC = 1e-6;

	private static final List<String> CHKN_QUEUE_FCLT_CD_LIST = List.of("CC");
	private static final List<String> DEP_QUEUE_FCLT_CD_LIST = List.of("SC", "SR");
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

		Integer targetQueueCnt;

		try {
			CgnGradeScale gradeScale = castCgnGradeService.retrieveGradeScale(searchDto.getFcltType(), context);
			BigDecimal normalMax = gradeScale.getNormalMax().setScale(0, RoundingMode.FLOOR);
			targetQueueCnt = normalMax.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0 ? null : normalMax.intValueExact();

            if (targetQueueCnt == null) {
                return fail("혼잡등급 NORMAL 상한이 정수 범위를 벗어났습니다. " + context);
            }
		} catch (IllegalStateException exception) {
			return fail(exception.getMessage());
		}

		FacilityQueueCalculator calculator = toCalculator(searchDto, unitCd, source);
		Computed<Double> arrival = calculator.estimateArrivalRateByConservation(source.toArrivalInput()); // 유입률
		Computed<Double> service = calculator.estimateServiceRatePerHour(); // 처리율
		LocalDateTime baseDt = source.getObsEndDt();

		FcltQueueScenarioDto result = toBaseResult(searchDto, unitCd, source, targetQueueCnt, arrival, service);
		result.setCurrent(toClear(calculator, source.toScenarioInput(arrival, source.getOprCnt()), targetQueueCnt, baseDt));

		if (searchDto.getMode() == FcltQueueScenarioMode.COUNT) {
			Integer count = searchDto.getOprFcltCnt() == null ? source.getOprCnt() : searchDto.getOprFcltCnt().intValueExact();
			String countInvalid = searchDto.getOprFcltCnt() == null ? null : validateCount(count, source);

			if (countInvalid != null) {
				return fail(countInvalid);
			}

			result.setScenario(toClear(calculator, source.toScenarioInput(arrival, count), targetQueueCnt, baseDt));
			return result;
		}

		int targetMin = searchDto.getTargetMinutes() == null ? DFLT_TARGET_MIN : searchDto.getTargetMinutes().intValueExact();
		applyRecommend(result, calculator, source, arrival, service, targetQueueCnt, targetMin);

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

		if (!queueDay.islandCdList().contains(unitCd)) {
			return null;
		}

		int bgnMinute = toMinutes(hhmm);
		int endMinute = Math.min(bgnMinute + OBS_MIN, MIN_PER_DAY);
		ChknQueueSlot slot = queueDay.slotOf(unitCd, bgnMinute, endMinute - bgnMinute);
		BigDecimal boothRatePerMin = queueDay.serviceRateOf(unitCd, bgnMinute, endMinute - bgnMinute);
		LocalDateTime dayStart = parseYmd(smltStng.getExcnYmd()).atStartOfDay();
		int oprCnt = slot.getOprBoothCnt();
		MaxCount maxCount = toMaxCount(oprCnt, getMasterCnt(tmnlId, unitCd, CHKN_QUEUE_FCLT_CD_LIST), "체크인카운터(CC)");

		return FcltQueueSource.builder()
				.fcltNm(unitCd + " 아일랜드")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(dayStart.plusMinutes(bgnMinute))
				.obsEndDt(dayStart.plusMinutes(endMinute))
				.queueAtStart(queueDay.queueAt(unitCd, bgnMinute - 1))
				.queueAtEnd(slot.getCurrentQueue())
				.wtngEndPsgCnt(slot.getPrcsPsgCnt())
				.avgPrcsSec(boothRatePerMin == null ? null : SEC_PER_MIN / boothRatePerMin.doubleValue())
				.avgQueuePsgCnt((double) slot.getAvgQueue())
				.avgWtngSec(slot.getPrcsPsgCnt() > 0 ? (double) slot.getAvgWaitSec() : null)
				.oprCnt(oprCnt)
				.totCnt(maxCount.value)
				.totCntRsn(maxCount.reason)
				.sharedHomogeneousServers(true)
				.mmSApplicable(true)
				.asmpList(CHKN_ASMP_LIST)
				.build();
	}

	private FcltQueueSource getDepSource(SmltStngDto smltStng, TerminalKind tmnlId, String hhmm, String unitCd) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		LocalDateTime dayStart = parseYmd(smltStng.getExcnYmd()).atStartOfDay();
		LocalDateTime bgnDt = dayStart.plusMinutes(toMinutes(hhmm));
		LocalDateTime windowEnd = bgnDt.plusMinutes(OBS_MIN).isBefore(dayStart.plusDays(1)) ? bgnDt.plusMinutes(OBS_MIN) : dayStart.plusDays(1);

		TreeMap<LocalDateTime, DepSlot> slotMap = new TreeMap<>();

		for (SmltRsltRawDto raw : castDsbdMapper.retrieveRsltByUnitList(
				smltStng.getSmltId(), fcltTmnlId, bgnDt.minusMinutes(CAST_SLOT_MIN), windowEnd, null, DEP_QUEUE_FCLT_CD_LIST)) {
			if (raw.getSmltActlDt() == null || !unitCd.equals(normalizeUnitCd(raw.getUnitCd()))) {
				continue;
			}

			slotMap.computeIfAbsent(raw.getSmltActlDt(), DepSlot::new).add(raw);
		}

		Integer masterCnt = getMasterCnt(tmnlId, unitCd, DEP_MAX_FCLT_CD_LIST);

		if (slotMap.isEmpty() && masterCnt == null) {
			return null;
		}

		List<DepSlot> windowList = new ArrayList<>(slotMap.tailMap(bgnDt, true).values());
		DepSlot first = windowList.isEmpty() ? null : windowList.get(0);
		DepSlot last = windowList.isEmpty() ? null : windowList.get(windowList.size() - 1);
		DepSlot start = first == null ? null : slotMap.get(first.dt.minusMinutes(CAST_SLOT_MIN));
		boolean contiguous = start != null && isContiguous(windowList);

		Integer oprCnt = getScrtyOpenCnt(smltStng, fcltTmnlId, unitCd);
		MaxCount maxCount = toMaxCount(oprCnt, masterCnt, "보안검색대(SC)");

		return FcltQueueSource.builder()
				.fcltNm(unitCd + "번 출국장")
				.dataSrc(QueueDataSource.CAST)
				.obsBgnDt(first == null ? bgnDt : first.dt.minusMinutes(CAST_SLOT_MIN))
				.obsEndDt(last == null ? windowEnd : last.dt)
				.queueAtStart(contiguous ? start.wtngPsgCnt : null)
				.queueAtEnd(last == null ? null : last.wtngPsgCnt)
				.wtngEndPsgCnt(contiguous ? windowList.stream().mapToInt(slot -> slot.trnstPsgCnt).sum() : null)
				.avgPrcsSec(weightedAvg(windowList, slot -> slot.prcsSecSum, slot -> slot.prcsPsgCnt))
				.avgQueuePsgCnt(windowList.isEmpty() ? null : windowList.stream().mapToInt(slot -> slot.wtngPsgCnt).average().getAsDouble())
				.avgWtngSec(weightedAvg(windowList, slot -> slot.wtngSecSum, slot -> slot.wtngWeightCnt))
				.oprCnt(oprCnt)
				.totCnt(maxCount.value)
				.totCntRsn(maxCount.reason)
				.sharedHomogeneousServers(true)
				.mmSApplicable(true)
				.asmpList(DEP_ASMP_LIST)
				.build();
	}

	private boolean isContiguous(List<DepSlot> slotList) {
		for (int index = 1; index < slotList.size(); index++) {
			if (!slotList.get(index - 1).dt.plusMinutes(CAST_SLOT_MIN).equals(slotList.get(index).dt)) {
				return false;
			}
		}

		return !slotList.isEmpty();
	}

	private Double weightedAvg(List<DepSlot> slotList, ToLongFunction<DepSlot> sum, ToLongFunction<DepSlot> weight) {
		long sumTotal = slotList.stream().mapToLong(sum).sum();
		long weightTotal = slotList.stream().mapToLong(weight).sum();

		return weightTotal > 0 ? (double) sumTotal / weightTotal : null;
	}

	private Integer getScrtyOpenCnt(SmltStngDto smltStng, String fcltTmnlId, String unitCd) {
		String resourceId = smltStng.getFcltyOpngScrtyCntrlRsrcId();

		if (resourceId == null || resourceId.isEmpty()) {
			throw new IllegalStateException("실행 리소스 정보를 찾을 수 없습니다. smltId=" + smltStng.getSmltId() + ", column=FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID");
		}

		for (FcltUnitRawDto raw : castDsbdMapper.retrieveScrtyOpenCountList(fcltTmnlId, resourceId)) {
			if (!unitCd.equals(normalizeUnitCd(raw.getUnitCd()))) {
				continue;
			}

			if (raw.getTotCnt() != 1) {
				throw new IllegalStateException("보안검색대 운영 snapshot 에 같은 게이트 행이 둘 이상입니다. smltId=" + smltStng.getSmltId()
						+ ", tmnlId=" + fcltTmnlId + ", resourceId=" + resourceId + ", unitCd=" + unitCd + ", rowCount=" + raw.getTotCnt());
			}

			return raw.getOprCnt();
		}

		return null;
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

	private FacilityQueueCalculator toCalculator(FcltQueueScenarioSearchDto searchDto, String unitCd, FcltQueueSource source) {
		return FacilityQueueCalculator.builder()
				.tmnlId(searchDto.getTmnlId().getValue())
				.fcltType(searchDto.getFcltType().getValue())
				.fcltId(unitCd)
				.queueId(searchDto.getFcltType().getValue() + "-" + unitCd)
				.intervalStart(source.getObsBgnDt())
				.intervalEnd(source.getObsEndDt())
				.source(source.getDataSrc())
				.avgPrcsTimeSec(source.getAvgPrcsSec())
				.avgWtngTimeSec(source.getAvgWtngSec())
				.avgQueuePsgCnt(source.getAvgQueuePsgCnt())
				.queuePsgCntAtEnd(source.getQueueAtEnd())
				.build();
	}

	private FcltQueueClearDto toClear(FacilityQueueCalculator calculator, FacilityQueueInput input, int targetQueueCnt, LocalDateTime baseDt) {
		Computed<Double> clear = calculator.estimateClearTimeSec(input, targetQueueCnt);
		Computed<Double> nextWtng = calculator.estimateNextArrivalWaitSec(input);
		Computed<ErlangCResult> erlang = calculator.analyzeErlangC(input);

		FcltQueueClearDto result = new FcltQueueClearDto();
		result.setFcltCnt(input.getOprServerCnt());
		result.setCgnClearMin(clear.hasValue() ? clear.getValue() / SEC_PER_MIN : null);
		result.setCgnClearDt(clear.hasValue() ? toClearDt(baseDt, clear.getValue()) : EMPTY);
		result.setClearMetric(QueueMetricDto.of(clear));
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

	private void applyRecommend(
			FcltQueueScenarioDto result,
			FacilityQueueCalculator calculator,
			FcltQueueSource source,
			Computed<Double> arrival,
			Computed<Double> service,
			int targetQueueCnt,
			int targetMin
	) {
		double targetSec = targetMin * SEC_PER_MIN;
		Integer currentCnt = source.getOprCnt();
		Integer totCnt = source.getTotCnt();
		LocalDateTime baseDt = source.getObsEndDt();
		Computed<Integer> fluid = calculator.estimateRequiredServerCnt(source.toScenarioInput(arrival, currentCnt), targetQueueCnt, targetSec);
		Integer stableMinCnt = toStableMinCnt(arrival, service);

		FcltQueueRecommendDto recommend = new FcltQueueRecommendDto();
		recommend.setTargetMin(targetMin);
		recommend.setReqMetric(QueueMetricDto.of(fluid));
		recommend.setFluidReqCnt(fluid.hasValue() ? fluid.getValue() : null);
		recommend.setStableMinCnt(stableMinCnt);
		result.setRecommend(recommend);

		if (!fluid.hasValue()) {
			return;
		}

		// 기존 fluid 추천의 의미는 바꾸지 않고, 양의 유입에서 rho < 1 이 되도록 이번 팝업 정책으로만 하한을 둔다
		int reqCnt = stableMinCnt == null ? fluid.getValue() : Math.max(fluid.getValue(), stableMinCnt);
		recommend.setReqCnt(reqCnt);
		recommend.setStableAplyYn(reqCnt > fluid.getValue() ? "Y" : "N");

		if (currentCnt != null) {
			recommend.setExtraCnt(Math.max(reqCnt - currentCnt, 0));
			recommend.setReduceCnt(Math.max(currentCnt - reqCnt, 0));
		}

		recommend.setCapaAvlYn(totCnt == null ? null : reqCnt <= totCnt ? "Y" : "N");

		if (totCnt != null && reqCnt > totCnt) {
			result.setTotScenario(toClear(calculator, source.toScenarioInput(arrival, totCnt), targetQueueCnt, baseDt));
			return;
		}

		FacilityQueueInput reqInput = source.toScenarioInput(arrival, reqCnt);
		Computed<Double> reqClear = calculator.estimateClearTimeSec(reqInput, targetQueueCnt);
		recommend.setGoalMetYn(reqClear.hasValue() ? reqClear.getValue() <= targetSec + GOAL_EPSILON_SEC ? "Y" : "N" : null);
		result.setScenario(toClear(calculator, reqInput, targetQueueCnt, baseDt));
	}

	private Integer toStableMinCnt(Computed<Double> arrival, Computed<Double> service) {
		if (!arrival.hasValue()) {
			return null;
		}

		if (arrival.getValue() == 0) {
			return 0;
		}

		if (!service.hasValue()) {
			return null;
		}

		double floor = Math.floor(arrival.getValue() / service.getValue() + RHO_EPSILON);

		return Double.isFinite(floor) && floor < Integer.MAX_VALUE ? (int) floor + 1 : null;
	}

	private FcltQueueScenarioDto toBaseResult(
			FcltQueueScenarioSearchDto searchDto,
			String unitCd,
			FcltQueueSource source,
			int targetQueueCnt,
			Computed<Double> arrival,
			Computed<Double> service
	) {
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
		result.setTargetQueueCnt(targetQueueCnt);
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

	private String toClearDt(LocalDateTime baseDt, double clearSec) {
		if (clearSec > MAX_CLEAR_SEC) {
			return EMPTY;
		}

		return formatDt(baseDt.plusSeconds((long) Math.ceil(clearSec)));
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

	private LocalDate parseYmd(String ymd) {
		return LocalDate.parse(ymd, DateTimeFormatter.ofPattern("yyyyMMdd"));
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

	/** 같은 결과 시각의 SC / SR 행을 합친 10분 결과 한 칸 */
	private static final class DepSlot {
		private final LocalDateTime dt;
		private int wtngPsgCnt;
		private int trnstPsgCnt;
		private long prcsSecSum;
		private long prcsPsgCnt;
		private long wtngSecSum;
		private long wtngWeightCnt;

		private DepSlot(LocalDateTime dt) {
			this.dt = dt;
		}

		private void add(SmltRsltRawDto raw) {
			wtngPsgCnt += raw.getWtngPsgCnt();
			trnstPsgCnt += raw.getTrnstPsgCnt();

			if (raw.getTrnstPsgCnt() > 0 && raw.getPrcsHr() > 0) {
				prcsSecSum += (long) raw.getPrcsHr() * raw.getTrnstPsgCnt();
				prcsPsgCnt += raw.getTrnstPsgCnt();
			}

			if (raw.getTrnstPsgCnt() > 0) {
				wtngSecSum += (long) raw.getWtngHr() * raw.getTrnstPsgCnt();
				wtngWeightCnt += raw.getTrnstPsgCnt();
			}
		}
	}
}
