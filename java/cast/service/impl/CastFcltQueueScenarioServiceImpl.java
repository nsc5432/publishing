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
import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.queue.ErlangCResult;
import aoms.pm.cast.domains.wtng.FcltQueueClearance;
import aoms.pm.cast.domains.wtng.FcltQueueSource;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;
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
import aoms.pm.cast.service.CastFcltQueueScenarioService;
import aoms.pm.cast.service.CastFcltWtngService;
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
	private static final int MIN_PER_HOUR = 60; // 1시간 = 60분
	private static final double SEC_PER_MIN = 60.0; // 1분 = 60초

    // 목표 해소시간
	private static final int DFLT_TARGET_MIN = FcltQueueClearance.DFLT_TARGET_MIN; // 목표 해소시간 기본값(분)
	private static final int MIN_TARGET_MIN = 1; // 목표 해소시간 최솟값(분)
	private static final int MAX_TARGET_MIN = 120; // 목표 해소시간 최댓값(분)

	private static final List<String> CHKN_QUEUE_FCLT_CD_LIST = List.of("CC");
	private static final List<String> DEP_MAX_FCLT_CD_LIST = List.of("SC");

	private static final List<String> COMMON_ASMP_LIST = List.of(
			"혼잡등급 / 해소 목표는 기준시각 직전 30분 [t-30분, t) 에 처리된 여객의 처리인원 가중평균 대기시간이다. 해소는 이 평균이 NORMAL 상한 미만이 되는 시각",
			"미래 평균은 같은 정의의 이동평균이다. 창의 기준시각 이전은 실제 처리 이력, 이후는 1분 단위 유체 FIFO 예측이며 남은 대기자의 대기시간은 이어서 센다",
			"추천 수량은 목표 시간 안에 목표 미만이 되고 처리능력(수량 × 처리율)이 유입률보다 큰 최소 총수다",
			"예측 구간 동안 유입률 / 처리율이 일정하고 시설 수는 즉시 바뀐다고 본다",
			"유입률은 관측구간 인원 보존식(종료 대기 - 시작 대기 + 서비스 시작)으로 역산한다",
			"M/M/s 적용 가정(정상상태 참고지표 전용): 포아송 도착 / 지수 처리시간 / 동일 처리율의 병렬 시설 / 공용 대기열 선착순 / 무한 대기공간 / 이탈 없음 (통계 검증 아님)");

	private static final List<String> CHKN_ASMP_LIST = List.of(
			"아일랜드 유인 카운터(CC) 공용 Queue — 부스별 결과를 1분 단위로 재구성해 10분 통계로 묶은 값",
			"처리 이력과 잔여 대기열 도착 시각은 10분 통계를 분 단위로 균등 분배한 근사다 (잔여 대기열은 계산 시작점까지 되짚는다). 1분 재구성 값과 다를 수 있다",
			"운영 부스 수는 관측구간 마지막 분의 배정 부스, 처리율은 같은 구간의 부스/분당 처리용량 평균",
			"배정 가능 최대 수량은 시설 마스터의 아일랜드 CC 수");

	private static final List<String> DEP_ASMP_LIST = List.of(
			"SC / SR 결과를 합산한 하나의 보안검색 Queue (요약보기 카드 추천과 같은 구성, 직렬 / 병렬 관계 미검증)",
			"통과여객수를 서비스 시작인원으로 근사한다 (처리 중 인원 변화 무시)",
			"CAST 10분 결과의 대기여객수를 결과 시각(구간 끝)의 스냅샷으로 본다",
			"10분 결과의 처리인원 / 대기시간 합은 그 10분에 균등하게 나뉜다고 본다 (분 단위 이동평균 계산용 근사)",
			"잔여 대기열의 도착 시각은 10분 보존식 유입을 분 단위로 균등 분배해 FIFO 로 되짚은 근사다 (최대 " + DepQueueDay.LOOKBACK_MIN + "분)",
			"운영 수량은 실행 리소스 보안검색 운영표의 FCLTY_CNT, 최대 수량은 시설 마스터 SC 수");

	private final CastDsbdMapper castDsbdMapper;
	private final CastSmltService castSmltService;
	private final CastFcltWtngService castFcltWtngService;

	@Override
	public FcltQueueScenarioDto retrieveFcltQueueScenario(FcltQueueScenarioSearchDto searchDto) {
		String invalid = validate(searchDto);

		if (invalid != null) {
			return fail(invalid);
		}

		String unitCd = searchDto.getUnitCd();
		String context = context(searchDto, unitCd);
		FcltWtngDay wtngDay;

		// 모델 선택 실패 / 혼잡등급 기준정보 오류 / 보완 불가는 팝업 오류로 알린다. DB 장애는 그대로 올린다
		try {
			SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(searchDto.getSmltId());
			wtngDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, searchDto.getTmnlId(), searchDto.getFcltType());
		} catch (IllegalStateException exception) {
			return fail(exception.getMessage());
		}

		LocalDateTime evalDt = wtngDay.dtOf(toMinutes(searchDto.getHhmm()));
		FcltQueueSource source = searchDto.getFcltType() == FcltType.CHKN
				? getChknSource(wtngDay, searchDto.getTmnlId(), evalDt, unitCd)
				: getDepSource(wtngDay, searchDto.getTmnlId(), evalDt, unitCd);

		if (source == null) {
			return fail("선택한 시설의 시뮬레이션 결과를 찾을 수 없습니다. " + context);
		}

		CgnGradeScale gradeScale = wtngDay.getGradeScale();

		FcltQueueClearance clearance = new FcltQueueClearance(source, gradeScale.getNormalUpperExclusiveSec());
		boolean isCount = searchDto.getMode() == FcltQueueScenarioMode.COUNT;
		int targetMin = isCount || searchDto.getTargetMinutes() == null ? DFLT_TARGET_MIN : searchDto.getTargetMinutes().intValueExact();

		FcltQueueScenarioDto result = toBaseResult(searchDto, unitCd, clearance);
		result.setCgnStatus(gradeScale.gradeOf(clearance.getObservedWait()).getValue());
		result.setCurrent(toClear(clearance, source.getOprCnt(), targetMin));

		if (isCount) {
			Integer count = searchDto.getOprFcltCnt() == null ? source.getOprCnt() : searchDto.getOprFcltCnt().intValueExact();
			String countInvalid = searchDto.getOprFcltCnt() == null ? null : validateCount(count, source);

			if (countInvalid != null) {
				return fail(countInvalid);
			}

			result.setScenario(toClear(clearance, count, targetMin));
			return result;
		}

		applyRecommend(result, clearance, targetMin);

		return result;
	}

	private String validate(FcltQueueScenarioSearchDto searchDto) {
		if (searchDto.getFcltType() != FcltType.CHKN && searchDto.getFcltType() != FcltType.DEP) {
			return "혼잡해소 시나리오는 체크인카운터 / 출국장만 조회할 수 있습니다.";
		}

		if (!FcltWtngSecs.isSecHhmm(searchDto.getHhmm())) {
			return "조회 시각은 10분 단위 HHmm(00~23시)이어야 합니다. hhmm=" + searchDto.getHhmm();
		}

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

	private FcltQueueSource getChknSource(FcltWtngDay wtngDay, TerminalKind tmnlId, LocalDateTime evalDt, String unitCd) {
		FcltQueueSource source = wtngDay.sourceOf(unitCd, evalDt);

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

	private FcltQueueSource getDepSource(FcltWtngDay wtngDay, TerminalKind tmnlId, LocalDateTime evalDt, String unitCd) {
		Integer masterCnt = getMasterCnt(tmnlId, unitCd, DEP_MAX_FCLT_CD_LIST);

		if (!wtngDay.hasResult(unitCd, evalDt) && masterCnt == null) {
			return null;
		}

		FcltQueueSource source = wtngDay.sourceOf(unitCd, evalDt);
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

	private FcltQueueClearDto toClear(FcltQueueClearance clearance, Integer serverCnt, int targetMin) {
		return toClear(clearance.clearOf(serverCnt, targetMin), clearance.getSource().getObsEndDt());
	}

	private FcltQueueClearDto toClear(FcltQueueClearance.ClearanceResult clear, LocalDateTime baseDt) {
		Computed<Double> clearSec = clear.getClearSec();
		Computed<Double> fcstWtng = clear.getFcstWtngSec();
		Computed<Double> nextWtng = clear.getNextWtngSec();
		Computed<ErlangCResult> erlang = clear.getErlang();

		FcltQueueClearDto result = new FcltQueueClearDto();
		result.setFcltCnt(clear.getServerCnt());
		result.setCgnClearMin(clear.getClearDt() == null ? null : clearSec.getValue() / SEC_PER_MIN);
		result.setCgnClearDt(clear.getClearDt() == null ? EMPTY : formatDt(clear.getClearDt()));
		result.setClearMetric(QueueMetricDto.of(clearSec));
		result.setFcstWtngSec(fcstWtng.hasValue() ? fcstWtng.getValue() : null);
		result.setFcstDt(formatDt(baseDt.plusMinutes(clear.getFcstMin())));
		result.setFcstWtngMetric(QueueMetricDto.of(fcstWtng));
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
		Integer goalOnlyMinCnt = calculated.getGoalOnlyMinCnt();

		FcltQueueRecommendDto recommend = new FcltQueueRecommendDto();
		recommend.setTargetMin(targetMin);
		recommend.setReqMetric(QueueMetricDto.of(calculated.getReqMetric()));
		recommend.setStableMinCnt(calculated.getStableMinCnt());
		result.setRecommend(recommend);

		Integer reqCnt = calculated.getReqCnt();

		if (reqCnt == null) {
			return;
		}

		recommend.setReqCnt(reqCnt);
		recommend.setStableAplyYn(goalOnlyMinCnt != null && reqCnt > goalOnlyMinCnt ? "Y" : "N");

		if (currentCnt != null) {
			recommend.setExtraCnt(Math.max(reqCnt - currentCnt, 0));
			recommend.setReduceCnt(Math.max(currentCnt - reqCnt, 0));
		}

		recommend.setCapaAvlYn(totCnt == null ? null : reqCnt <= totCnt ? "Y" : "N");

		// 카드는 보유 수량을 넘어도 추천 수량 가정값을 그리지만, 팝업은 최대수 전량 배정 결과를 따로 보여준다
		if (totCnt != null && reqCnt > totCnt) {
			result.setTotScenario(toClear(clearance, totCnt, targetMin));
			return;
		}

		recommend.setGoalMetYn(calculated.getGoalMet() == null ? null : calculated.getGoalMet() ? "Y" : "N");
		result.setScenario(toClear(calculated.getReqClear(), clearance.getSource().getObsEndDt()));
	}

	private FcltQueueScenarioDto toBaseResult(FcltQueueScenarioSearchDto searchDto, String unitCd, FcltQueueClearance clearance) {
		FcltQueueSource source = clearance.getSource();
		Computed<Double> arrival = clearance.getArrival();
		Computed<Double> service = clearance.getService();
		Computed<Double> observedWait = clearance.getObservedWait();
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
		result.setTargetQueueCnt(null);
		result.setNormalUpperExclusiveSec(clearance.getNormalUpperExclusiveSec());
		result.setWtngAvgSec(observedWait.hasValue() ? observedWait.getValue() : null);
		result.setWtngAvgPrcsPsgCnt(source.getPrcsPsgCnt());
		result.setWtngAvgMetric(QueueMetricDto.of(observedWait));
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
