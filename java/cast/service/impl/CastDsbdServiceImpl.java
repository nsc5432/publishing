package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;
import static java.util.stream.Collectors.toMap;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.CgnOrder;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknSbdDay;
import aoms.pm.cast.domains.dsbd.AssignmentSummary;
import aoms.pm.cast.domains.dsbd.IslandMainAln;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.wtng.FcltQueueClearance;
import aoms.pm.cast.domains.wtng.FcltQueueSource;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;
import aoms.pm.cast.domains.wtng.FcltWtngSlot;
import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.ChknAlnAssignmentRawDto;
import aoms.pm.cast.dto.DowAttrDto;
import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdFltIntrvlDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
import aoms.pm.cast.dto.DsbdIntrvlRawDto;
import aoms.pm.cast.dto.DsbdRsltDto;
import aoms.pm.cast.dto.DsbdSearchDto;
import aoms.pm.cast.dto.FcltRecommendDto;
import aoms.pm.cast.dto.FcltUnitDto;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.FltPlanDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
import aoms.pm.cast.dto.HourlyPsgDto;
import aoms.pm.cast.dto.HourlyPsgItemDto;
import aoms.pm.cast.dto.PeakDto;
import aoms.pm.cast.dto.PsgDptcnyTrnsPrfmncRawDto;
import aoms.pm.cast.dto.PsgWtngRawDto;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.TmnlSmryDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.DowType;
import aoms.pm.cast.enums.DsbdCategory;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.SmltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.mapper.CastFltPsgMapper;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastDsbdService;
import aoms.pm.cast.service.CastFcltWtngService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastDsbdServiceImpl implements CastDsbdService {
	private static final String YMD_FORMAT = "yyyyMMdd";
	private static final String DT_FORMAT = "yyyyMMddHHmmss";
	private static final String EMPTY = "";
    private static final int SEC_PER_MIN = 60;
	private static final int MIN_PER_HOUR = 60;
	private static final int MIN_PER_DAY = 24 * MIN_PER_HOUR;
	private static final int DEFAULT_INTRVL_MIN = 60;
	private static final String DEP_TARGET_NM = "보안검색대";
	private static final List<String> DEP_CARD_FCLT_CD_LIST = List.of("LGT", "SC", "SR");
	private static final Comparator<AssignmentSummary> MAIN_ALN_ORDER = Comparator.comparingInt(AssignmentSummary::getAssignedCount).reversed().thenComparing(AssignmentSummary::getAlnCd);

	private final CastDsbdMapper castDsbdMapper;
	private final CastFltPsgMapper castFltPsgMapper;
	private final CastSmltMapper castSmltMapper;
	private final CastSmltService castSmltService;
	private final CastChknQueueService castChknQueueService;
	private final CastFcltWtngService castFcltWtngService;

	@Override
	public DsbdBaseInfoDto retrieveDailySmltBaseInfo(DsbdSearchDto searchDto) {
		DsbdBaseInfoDto result = new DsbdBaseInfoDto();
		String smltId = castDsbdMapper.retrieveSmltIdByYmd(searchDto.getYmd(), SmltType.DAILY.getDbCode());

		result.setYmd(searchDto.getYmd());
		result.setSmltType(SmltType.DAILY);
		result.setAvlTimes(new ArrayList<>());
		result.setLastCalcDt(EMPTY);
		result.setNextCalcDt(EMPTY);

		if (smltId == null || smltId.isEmpty()) {
			result.error("해당 일자의 시뮬레이션 결과가 없습니다.");
			return result;
		}

		String lastCalcDt = castDsbdMapper.retrieveLastCalcDt(smltId);

		result.setSmltId(smltId);
		result.setLastCalcDt(lastCalcDt);
		result.setNextCalcDt(getNextCalcDt(lastCalcDt));
		result.setAvlTimes(toSecHhmmList(castDsbdMapper.retrieveAvlTimeList(smltId)));

		return result;
	}

	@Override
	public DsbdBaseInfoDto retrieveUserSmltBaseInfo(DsbdSearchDto searchDto) {
		DsbdBaseInfoDto result = new DsbdBaseInfoDto();
		String smltId = searchDto.getSmltId();

		result.setSmltType(SmltType.USER);
		result.setAvlTimes(new ArrayList<>());
		result.setLastCalcDt(EMPTY);
		result.setNextCalcDt(EMPTY);

		if (smltId == null || smltId.isEmpty()) {
			result.error("사용자 시뮬레이션 실행 ID가 필요합니다.");
			return result;
		}

		SmltExcnDto execution = castSmltMapper.retrieveSmltFlfmt(smltId);
		if (execution == null || !SmltType.USER.getDbCode().equals(execution.getSmltType())) {
			result.error("사용자 시뮬레이션 수행 이력을 찾을 수 없습니다.");
			return result;
		}

		List<String> avlTimes = toSecHhmmList(castDsbdMapper.retrieveAvlTimeList(smltId));
		if (avlTimes.isEmpty()) {
			result.error("해당 사용자 시뮬레이션 결과가 없습니다.");
			return result;
		}

		result.setSmltId(smltId);
		result.setYmd(execution.getExcnYmd());
		result.setLastCalcDt(castDsbdMapper.retrieveLastCalcDt(smltId));
		result.setAvlTimes(avlTimes);

		return result;
	}

	// 선택 후보를 카드 / 혼잡등급 API 가 받는 10분 경계로 맞춘다
	private List<String> toSecHhmmList(List<String> timeList) {
		Set<String> result = new TreeSet<>();

		for (String time : timeList) {
			String floored = time != null && time.length() == 4 ? time.substring(0, 3) + "0" : EMPTY;

			if (FcltWtngSecs.isSecHhmm(floored)) {
				result.add(floored);
			}
		}

		return new ArrayList<>(result);
	}

	@Override
	public DsbdHeaderDto retrieveDailySmltHeader(DsbdSearchDto searchDto) {
		DsbdHeaderDto result = new DsbdHeaderDto();
		String ymd = searchDto.getYmd();

		FltSmryRawDto fltSmry = castDsbdMapper.retrieveFltSmry(ymd, null, null, null);
		List<HourlyPsgDto> hourlyPsgList = new ArrayList<>();

		for (TerminalKind tmnlId : TerminalKind.getList()) {
			hourlyPsgList.add(getHourlyPsg(ymd, tmnlId));
		}

		result.setYmd(ymd);
		result.setFltPlan(getFltPlan(fltSmry));
		result.setHourlyPsgList(hourlyPsgList);
		result.setDowAttr(getDowAttr(ymd));
		result.setWeather(castDsbdMapper.retrieveWeather(ymd));

		return result;
	}

	@Override
	public TmnlSmryDto retrieveDailySmltTmnlSmry(DsbdSearchDto searchDto) {
		TmnlSmryDto result = new TmnlSmryDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		List<String> fltTmnlIdList = tmnlId.getFltTmnlIdList();

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());
		LocalDate baseDate = parseYmd(smltStng.getExcnYmd());

		FltSmryRawDto baseFltSmry = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate), fltTmnlIdList, null, null);
		FltSmryRawDto yesterdayFltSmry = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate.minusDays(1)), fltTmnlIdList, null, null);
		FltSmryRawDto lastWeekFltSmry = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate.minusDays(7)), fltTmnlIdList, null, null);

		result.setTmnlId(tmnlId.getValue());
		result.setFltCnt(baseFltSmry.getDepFltCnt());
		result.setPsgCnt(baseFltSmry.getDepPsgCnt());
		result.setFltDiffCnt(baseFltSmry.getDepFltCnt() - lastWeekFltSmry.getDepFltCnt());
		result.setPsgDiffCnt(baseFltSmry.getDepPsgCnt() - lastWeekFltSmry.getDepPsgCnt());
		result.setYesterdayFltDiffCnt(baseFltSmry.getDepFltCnt() - yesterdayFltSmry.getDepFltCnt());
		result.setYesterdayPsgDiffCnt(baseFltSmry.getDepPsgCnt() - yesterdayFltSmry.getDepPsgCnt());
		result.setBrdgRate(getBrdgRate(baseFltSmry));
		result.setPeak(getPeak(searchDto.getSmltId(), tmnlId));

		int intrvlMin = searchDto.getIntrvlMin() != null ? searchDto.getIntrvlMin() : DEFAULT_INTRVL_MIN;
		String bgnHhmm = searchDto.getHhmm();

		result.setIntrvlMin(intrvlMin);

		if (intrvlMin <= 0 || intrvlMin > MIN_PER_DAY) {
			result.error("구간 집계 길이는 1~1440분이어야 합니다.");
			return result;
		}

		if (bgnHhmm != null && !bgnHhmm.isEmpty() && !FcltWtngSecs.isSecHhmm(bgnHhmm)) {
			result.error("조회 시각은 10분 단위 HHmm(00~23시)이어야 합니다. hhmm=" + bgnHhmm);
			return result;
		}

		if (bgnHhmm != null && bgnHhmm.length() == 4) {
			// 대표 혼잡등급은 PRIME TIME(대기인원 피크)과 별개로 조회 시각의 시설별 평균 대기시간에서 정한다
			applyTmnlCgn(result, smltStng.getSmltId(), tmnlId, bgnHhmm);

			List<DsbdFltIntrvlDto> intrvlList = retrieveFltIntrvlList(baseDate, fltTmnlIdList, bgnHhmm, intrvlMin);
			DsbdFltIntrvlDto currentIntrvl = intrvlList.get(0);

			result.setIntrvlList(intrvlList);
			result.setIntrvlFltCnt(currentIntrvl.getFltCnt());
			result.setIntrvlPsgCnt(currentIntrvl.getPsgCnt());
			result.setIntrvlYesterdayFltDiffCnt(currentIntrvl.getYesterdayFltDiffCnt());
			result.setIntrvlYesterdayPsgDiffCnt(currentIntrvl.getYesterdayPsgDiffCnt());

			LocalDateTime bgnDt = baseDate.atStartOfDay().plusMinutes(toMinutes(bgnHhmm));
			LocalDateTime endDt = baseDate.atStartOfDay().plusMinutes(Math.min(toMinutes(bgnHhmm) + intrvlMin, MIN_PER_DAY));
			DsbdIntrvlRawDto intrvl = castDsbdMapper.retrieveRsltByIntrvl(
					searchDto.getSmltId(), smltStng.getSmltMdlSn(), tmnlId.getFcltTmnlId(),
					bgnDt, endDt, DsbdCategory.PSG.getUpPsgFcltCdList());

			if (intrvl != null) {
				if (intrvl.getSrcExcnDtCnt() > 1) {
					result.error("조회 구간에 실행일시가 다른 원천 결과가 있어 요약정보를 산정할 수 없습니다.");
					return result;
				}

				result.setIntrvlMaxWtngPsgCnt(intrvl.getMaxWtngPsgCnt());
				result.setIntrvlAvgWtngSec(intrvl.getAvgWtngSec());
				result.setIntrvlPrcsPsgCnt(intrvl.getPrcsPsgCnt());
			}
		}

		return result;
	}

	private List<DsbdFltIntrvlDto> retrieveFltIntrvlList(LocalDate baseDate, List<String> fltTmnlIdList,
			String hhmm, int intrvlMin) {
		List<DsbdFltIntrvlDto> result = new ArrayList<>();
		int baseMin = toMinutes(hhmm);

		for (int offset = 0; offset < 3; offset++) {
			int bgnMin = baseMin + offset * MIN_PER_HOUR;
			if (bgnMin >= MIN_PER_DAY) {
				break;
			}

			String bgnHhmm = toHhmm(bgnMin);
			String endHhmm = getEndHhmm(bgnHhmm, intrvlMin);
			FltSmryRawDto base = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate), fltTmnlIdList, bgnHhmm, endHhmm);
			FltSmryRawDto yesterday = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate.minusDays(1)), fltTmnlIdList, bgnHhmm, endHhmm);
			DsbdFltIntrvlDto item = new DsbdFltIntrvlDto();
			item.setBgnHhmm(bgnHhmm);
			item.setEndHhmm(endHhmm);
			item.setFltCnt(base.getDepFltCnt());
			item.setPsgCnt(base.getDepPsgCnt());
			item.setYesterdayFltDiffCnt(base.getDepFltCnt() - yesterday.getDepFltCnt());
			item.setYesterdayPsgDiffCnt(base.getDepPsgCnt() - yesterday.getDepPsgCnt());
			result.add(item);
		}

		return result;
	}

	private void applyTmnlCgn(TmnlSmryDto result, String smltId, TerminalKind tmnlId, String hhmm) {
		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(smltId);

		FcltWtngDay chknDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.CHKN);
		LocalDateTime evalDt = chknDay.dtOf(toMinutes(hhmm));

		for (String island : chknDay.unitCdList()) {
			applyWorseCgn(result, chknDay, island, evalDt);
		}

		FcltWtngDay depDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.DEP);

		for (String unitCd : depDay.presentUnitCdList(evalDt)) {
			applyWorseCgn(result, depDay, unitCd, evalDt);
		}
	}

	// 체크인 / 출국장 기준표가 달라 대기시간만으로 비교하지 않는다 — 등급이 같을 때만 대기시간이 긴 시설을 남긴다
	private void applyWorseCgn(TmnlSmryDto result, FcltWtngDay wtngDay, String unitCd, LocalDateTime evalDt) {
		Computed<Double> wtngSec = wtngDay.avgWtngSecOf(unitCd, evalDt);
		CongestionStatus status = wtngDay.getGradeScale().gradeOf(wtngSec).getValue();

		if (status == null) {
			return;
		}

		CongestionStatus worstStatus = result.getCgnStatus();

		if (worstStatus == null || status.compareTo(worstStatus) > 0
				|| status == worstStatus && wtngSec.getValue() > result.getCgnWtngSec()) {
			result.setCgnStatus(status);
			result.setCgnWtngSec(wtngSec.getValue());
		}
	}

	@Override
	public List<DsbdRsltDto> retrieveDailySmltTmnlRsltByTime(DsbdSearchDto searchDto) {
		DsbdCategory category = searchDto.getCategory();
		TerminalKind tmnlId = searchDto.getTmnlId();

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		if (category == DsbdCategory.CHKN) {
			return retrieveChknRsltByTime(smltStng, tmnlId);
		}

		if (category == DsbdCategory.DEP) {
			return retrieveDepRsltByTime(searchDto.getSmltId(), tmnlId, smltStng.getExcnYmd());
		}

		Map<String, SmltRsltRawDto> rsltByHour = castDsbdMapper
				.retrieveRsltByHourList(searchDto.getSmltId(), tmnlId.getFcltTmnlId(), category.getUpPsgFcltCdList())
				.stream().collect(toMap(SmltRsltRawDto::getTime, Function.identity(), (first, ignored) -> first));

		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper
				.retrieveFltPsgHourList(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList())
				.stream().collect(toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

		Map<String, PsgWtngRawDto> psgWtngByHour = castDsbdMapper
				.retrievePsgWtngByHourList(smltStng.getExcnYmd(), tmnlId.getFcltTmnlId(), category.getPsgWtngFcltTypeCdList())
				.stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		String lastWeekYmd = formatYmd(parseYmd(smltStng.getExcnYmd()).minusDays(7));
		Map<String, PsgWtngRawDto> lastWeekPsgWtngByHour = castDsbdMapper
				.retrievePsgWtngByHourList(lastWeekYmd, tmnlId.getFcltTmnlId(), category.getPsgWtngFcltTypeCdList())
				.stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		List<DsbdRsltDto> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			result.add(toRsltDto(
					hour,
					rsltByHour.get(hour + "00"),
					fltPsgByHour.get(hour),
					psgWtngByHour.get(hour + "00"),
					lastWeekPsgWtngByHour.get(hour + "00"),
					category
			));
		}

		return result;
	}

	@Override
	public List<DsbdFcltCardDto> retrieveDailySmltFcltCard(DsbdSearchDto searchDto) {
		FcltType fcltType = searchDto.getFcltType();

		if (!FcltWtngSecs.isSecHhmm(searchDto.getHhmm())) {
			throw new IllegalArgumentException("조회 시각은 10분 단위 HHmm(00~23시)이어야 합니다. hhmm=" + searchDto.getHhmm());
		}

		if (fcltType == FcltType.CHKN) {
			return getChknFcltCardList(searchDto);
		}

		TerminalKind tmnlId = searchDto.getTmnlId();
		String smltId = searchDto.getSmltId();

		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(smltId);
		FcltWtngDay wtngDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.DEP);
		LocalDateTime evalDt = wtngDay.dtOf(toMinutes(searchDto.getHhmm()));
		CgnGradeScale gradeScale = wtngDay.getGradeScale();

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(tmnlId.getFcltTmnlId(), DEP_CARD_FCLT_CD_LIST)
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getDepUnitList(unitMap, wtngDay, evalDt);
		List<FcltQueueClearance> clearanceList = wtngDay.presentUnitCdList(evalDt).stream()
				.map(unitCd -> wtngDay.clearanceOf(unitCd, evalDt))
				.sorted(CgnOrder.byWaitDesc(
                    (FcltQueueClearance clearance) -> clearance.getObservedWait().getValue(),
                    clearance -> queueOf(clearance.getSource()),
                    clearance -> clearance.getSource().getUnitCd()
                ))
				.collect(toList());
		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (FcltQueueClearance clearance : clearanceList) {
			String unitCd = clearance.getSource().getUnitCd();

			result.add(getDepFcltCard(clearance, unitMap.get(unitCd), unitList, gradeScale.gradeOf(clearance.getObservedWait()).getValue()));
		}

		return result;
	}

	private List<DsbdFcltCardDto> getChknFcltCardList(DsbdSearchDto searchDto) {
		TerminalKind tmnlId = searchDto.getTmnlId();
		String smltId = searchDto.getSmltId();
		String hhmm = searchDto.getHhmm();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String baseContext = baseContext(smltId, tmnlId, hhmm);

		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(smltId);
		FcltWtngDay wtngDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.CHKN);
		LocalDateTime evalDt = wtngDay.dtOf(toMinutes(hhmm));
		IslandMainAln islandMainAln = retrieveIslandMainAln(smltStng, fcltTmnlId, evalDt);

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, List.of("CC"))
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getChknUnitList(unitMap, wtngDay, evalDt);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (String unitCd : sortedByWait(wtngDay, evalDt)) {
			result.add(getChknFcltCard(unitCd, wtngDay, evalDt, unitMap.get(unitCd), unitList, islandMainAln, baseContext));
		}

		return result;
	}

	// 카드는 평균 대기시간이 긴 아일랜드부터 — 첫 카드가 화면에 먼저 보인다
	private List<String> sortedByWait(FcltWtngDay wtngDay, LocalDateTime evalDt) {
		Map<String, Double> avgWtngSecMap = new LinkedHashMap<>();
		Map<String, Integer> queueMap = new LinkedHashMap<>();

		for (String unitCd : wtngDay.unitCdList()) {
			FcltWtngSlot slot = wtngDay.windowSlotOf(unitCd, evalDt);

			if (slot.getCurrentQueue() > 0 || slot.getPrcsPsgCnt() > 0 || slot.getOprBoothCnt() > 0) {
				avgWtngSecMap.put(unitCd, wtngDay.avgWtngSecOf(unitCd, evalDt).getValue());
				queueMap.put(unitCd, slot.getCurrentQueue());
			}
		}

		List<String> result = new ArrayList<>(queueMap.keySet());
		result.sort(CgnOrder.byWaitDesc(avgWtngSecMap::get, queueMap::get, Function.identity()));

		return result;
	}

	private List<FcltUnitDto> getChknUnitList(Map<String, FcltUnitRawDto> unitMap, FcltWtngDay wtngDay, LocalDateTime evalDt) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = normalizeUnitCd(unit.getUnitCd());

			if (unitCd.isEmpty()) {
				continue;
			}

			FcltWtngSlot slot = wtngDay.windowSlotOf(unitCd, evalDt);

			result.add(new FcltUnitDto()
                .withUnitCd(unitCd)
                .withCgnStatus(wtngDay.gradeOf(unitCd, evalDt).getValue())
                .withUseYn(slot.getOprBoothCnt() > 0 ? "Y" : "N")
            );
		}

		return result;
	}

	private DsbdFcltCardDto getChknFcltCard(String unitCd, FcltWtngDay wtngDay, LocalDateTime evalDt, FcltUnitRawDto unit, List<FcltUnitDto> unitList, IslandMainAln islandMainAln, String baseContext) {
		String unitContext = unitContext(baseContext, FcltType.CHKN, unitCd);
		FcltQueueClearance clearance = wtngDay.clearanceOf(unitCd, evalDt);

		if (clearance == null) {
			throw new IllegalStateException("선택한 시설의 시뮬레이션 결과를 찾을 수 없습니다. " + unitContext);
		}

		FcltWtngSlot slot = wtngDay.windowSlotOf(unitCd, evalDt);
		FcltQueueClearance.Recommend recommend = clearance.recommendOf(FcltQueueClearance.DFLT_TARGET_MIN);
		Integer reqCnt = recommend.getReqCnt();
		int queuePsgCnt = slot.getCurrentQueue();
		String mainAlnNm = reqCnt == null ? EMPTY : islandMainAln.getAlnNm(unitCd, unitContext);
		boolean needAssign = reqCnt != null && reqCnt > slot.getOprBoothCnt() && !mainAlnNm.isEmpty();

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(FcltType.CHKN.getValue() + "-" + unitCd);
		result.setFcltType(FcltType.CHKN);
		result.setIsland(unitCd);
		result.setDptgtNo(EMPTY);
		result.setFcltNm(unitCd);
		result.setTotCnt(unit != null ? unit.getTotCnt() : 0);
		result.setOprCnt(slot.getOprBoothCnt());
		result.setWtngPsgCnt(queuePsgCnt);
		applyClearance(result, clearance, recommend);
		result.setCgnStatus(wtngDay.gradeOf(unitCd, evalDt).getValue());
		result.setRecommend(getRecommend(mainAlnNm, reqCnt, needAssign));
		result.setUnitList(unitList);

		return result;
	}

	private List<FcltUnitDto> getDepUnitList(Map<String, FcltUnitRawDto> unitMap, FcltWtngDay wtngDay, LocalDateTime evalDt) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = normalizeUnitCd(unit.getUnitCd());

			if (unitCd.isEmpty()) {
				continue;
			}

			result.add(
                new FcltUnitDto()
                    .withUnitCd(unitCd)
                    .withCgnStatus(wtngDay.gradeOf(unitCd, evalDt).getValue())
                    .withUseYn(unit.getOprCnt() > 0 ? "Y" : "N")
            );
		}

		return result;
	}

	private DsbdFcltCardDto getDepFcltCard(
			FcltQueueClearance clearance,
			FcltUnitRawDto unit,
			List<FcltUnitDto> unitList,
			CongestionStatus cgnStatus
	) {
		String unitCd = clearance.getSource().getUnitCd();
		FcltQueueClearance.Recommend recommend = clearance.recommendOf(FcltQueueClearance.DFLT_TARGET_MIN);

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(FcltType.DEP.getValue() + "-" + unitCd);
		result.setFcltType(FcltType.DEP);
		result.setIsland(EMPTY);
		result.setDptgtNo(unitCd);
		result.setFcltNm(unitCd + "번");
		result.setTotCnt(unit != null ? unit.getTotCnt() : 0);
		result.setOprCnt(unit != null ? unit.getOprCnt() : 0);
		result.setWtngPsgCnt(queueOf(clearance.getSource()));
		applyClearance(result, clearance, recommend);
		result.setCgnStatus(cgnStatus);
		result.setRecommend(getRecommend(recommend.getReqCnt() == null ? EMPTY : DEP_TARGET_NM, recommend.getReqCnt(), false));
		result.setUnitList(unitList);

		return result;
	}

	/*
	 * 해소값은 보유 수량을 넘어도 추천 수량을 가정
	 */
	private void applyClearance(DsbdFcltCardDto card, FcltQueueClearance clearance, FcltQueueClearance.Recommend recommend) {
		Computed<Double> prcsPerHour = clearance.getObservedPrcsPerHour();
		Computed<Double> loadRatio = clearance.getLoadRatio();
		FcltQueueClearance.ClearanceResult clear = recommend.getReqClear();
		Integer clearMin = clear == null ? null : clear.getClearMin();

		card.setCgnWtngSec(clearance.getObservedWait().getValue());
		card.setHrlyPrcsPsgCnt(prcsPerHour.hasValue() ? toRoundedInt(prcsPerHour.getValue()) : 0);
		card.setHrlyPrcsRate(loadRatio.hasValue() ? toRoundedInt(loadRatio.getValue() * 100) : 0);
		card.setCgnClearTime(clearMin == null ? EMPTY : clear.getClearDt().format(DateTimeFormatter.ofPattern("HHmm")));
		card.setCgnClearRate(clearMin == null ? 0 : toClearRate(clearMin));
	}

	private FcltRecommendDto getRecommend(String targetName, Integer reqCnt, boolean needAssign) {
		FcltRecommendDto result = new FcltRecommendDto();
		result.setTargetNm(targetName);
		result.setReqCnt(reqCnt);
		result.setNeedAssignYn(needAssign ? "Y" : "N");

		return result;
	}

	private int toClearRate(int clearMin) {
		int remainingMinutes = Math.max(FcltQueueClearance.DFLT_TARGET_MIN - clearMin, 0);

		return remainingMinutes * 100 / FcltQueueClearance.DFLT_TARGET_MIN;
	}

	private int toRoundedInt(double value) {
		return (int) Math.min(Math.round(value), Integer.MAX_VALUE);
	}

	private int queueOf(FcltQueueSource source) {
		return source.getQueueAtEnd() == null ? 0 : source.getQueueAtEnd();
	}

	private FltPlanDto getFltPlan(FltSmryRawDto raw) {
		FltPlanDto result = new FltPlanDto();

		result.setDepFltCnt(raw.getDepFltCnt());
		result.setArrFltCnt(raw.getArrFltCnt());
		result.setTotFltCnt(raw.getDepFltCnt() + raw.getArrFltCnt());
		result.setDepPsgCnt(raw.getDepPsgCnt());
		result.setTotPsgCnt(raw.getDepPsgCnt() + raw.getArrPsgCnt());

		return result;
	}

	private HourlyPsgDto getHourlyPsg(String ymd, TerminalKind tmnlId) {
		Map<String, PsgDptcnyTrnsPrfmncRawDto> prcsMap = castDsbdMapper
				.retrieveHourlyPsgDptcnyTrnsPrfmncList(ymd, tmnlId.getFltTmnlIdList())
				.stream().collect(toMap(PsgDptcnyTrnsPrfmncRawDto::getHour, Function.identity(), (first, ignored) -> first));
		Map<String, BdpsgAnceRawDto> fcstMap = castDsbdMapper.retrieveHourlyBdpsgAnceList(ymd, tmnlId.getFltTmnlIdList())
				.stream().collect(toMap(BdpsgAnceRawDto::getHour, Function.identity(), (first, ignored) -> first));

		List<HourlyPsgItemDto> itemList = new ArrayList<>();
		int totPsgCnt = 0;
		int maxPsgCnt = 0;

		for (String hour : TimeBucketUtils.hourList()) {
			PsgDptcnyTrnsPrfmncRawDto prcs = prcsMap.get(hour);
			BdpsgAnceRawDto fcst = fcstMap.get(hour);
			int psgCnt = prcs != null ? prcs.getPrcsPsgCnt() : 0;
			int fcstPsgCnt = fcst != null ? fcst.getEstBrdgTnope() : 0;

			totPsgCnt += psgCnt;
			maxPsgCnt = Math.max(maxPsgCnt, Math.max(psgCnt, fcstPsgCnt));
			itemList.add(new HourlyPsgItemDto().withTime(hour).withPsgCnt(psgCnt).withFcstPsgCnt(fcstPsgCnt));
		}

		HourlyPsgDto result = new HourlyPsgDto();
		result.setTmnlId(tmnlId.getValue());
		result.setTotPsgCnt(totPsgCnt);
		result.setMaxPsgCnt(maxPsgCnt);
		result.setItemList(itemList);

		return result;
	}

	private DowAttrDto getDowAttr(String ymd) {
		LocalDate date = parseYmd(ymd);
		DowType dowType = DowType.of(date.getDayOfWeek());
		String dowNm = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.KOREAN);

		DowAttrDto result = new DowAttrDto();
		result.setDowType(dowType);
		result.setDowNm(getDowNm(dowType, dowNm));
		// 공휴일 달력 테이블이 확인되지 않았다 (D7)
		result.setSpclNote(EMPTY);

		return result;
	}

	private String getDowNm(DowType dowType, String dowNm) {
		if (dowType == DowType.PRE_WEEKEND) {
			return "주말 전일(" + dowNm + ")";
		}

		return dowType == DowType.WEEKEND ? "주말(" + dowNm + ")" : "평일(" + dowNm + ")";
	}

	private PeakDto getPeak(String smltId, TerminalKind tmnlId) {
		List<SmltRsltRawDto> rsltList = castDsbdMapper.retrieveRsltByHourList(smltId, tmnlId.getFcltTmnlId(), DsbdCategory.PSG.getUpPsgFcltCdList());

		PeakDto result = new PeakDto();
		result.setAmpm("AM");
		result.setPeakTime(EMPTY);

		SmltRsltRawDto peak = rsltList.stream().max(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt)).orElse(null);

		if (peak == null) {
			return result;
		}

		int hour = Integer.parseInt(peak.getTime().substring(0, 2));

		result.setAmpm(hour < 12 ? "AM" : "PM");
		result.setPeakTime(peak.getTime());
		result.setWtngPsgCnt(peak.getWtngPsgCnt());
		result.setMaxWtngHr(peak.getWtngHr() / SEC_PER_MIN);
		result.setHrlyPrcsPsgCnt(peak.getTrnstPsgCnt());

		return result;
	}

    // PRIME TIME 체크인카운터
	private List<DsbdRsltDto> retrieveChknRsltByTime(SmltStngDto smltStng, TerminalKind tmnlId) {
		String smltId = smltStng.getSmltId();
		String excnYmd = smltStng.getExcnYmd();
		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper
            .retrieveFltPsgHourList(excnYmd, tmnlId.getFltTmnlIdList())
            .stream().collect(toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

        // Cast Queue
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltStng, tmnlId);
		ChknSbdDay sbdDay = castChknQueueService.retrieveChknSbdDay(smltId, tmnlId, excnYmd);
		Set<String> islandCdSet = new LinkedHashSet<>(queueDay.islandCdList());
		islandCdSet.addAll(sbdDay.islandCdList());

        // Xovis Queue
        String lastWeekYmd = formatYmd(parseYmd(excnYmd).minusDays(7));
		Map<String, PsgWtngRawDto> psgWtngByHour = castDsbdMapper
            .retrievePsgWtngIslSumByHourList(excnYmd, tmnlId.getFcltTmnlId())
            .stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));
		
        Map<String, PsgWtngRawDto> lastWeekPsgWtngByHour = castDsbdMapper
            .retrievePsgWtngIslSumByHourList(lastWeekYmd, tmnlId.getFcltTmnlId())
            .stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));
	
        List<DsbdRsltDto> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			result.add(toChknRsltDto(
                hour,
                queueDay,
                sbdDay,
                islandCdSet,
                fltPsgByHour.get(hour),
                psgWtngByHour.get(hour + "00"),
                lastWeekPsgWtngByHour.get(hour + "00")
			));
		}

		return result;
	}

	private DsbdRsltDto toChknRsltDto(
        String hour,
        ChknQueueDay queueDay,
        ChknSbdDay sbdDay,
        Set<String> islandCdSet,
        FltPsgRawDto fltPsg,
        PsgWtngRawDto psgWtng,
        PsgWtngRawDto lastWeekPsgWtng
	) {
		int bgnMinute = Integer.parseInt(hour) * MIN_PER_HOUR;
		int endMinute = bgnMinute + MIN_PER_HOUR;
		FcltWtngSlot cc = queueDay.tmnlSeries().slotOf(bgnMinute, MIN_PER_HOUR);
		int maxIslandQueue = 0;
		int endQueue = cc.getCurrentQueue();

		for (String island : islandCdSet) {
			endQueue += sbdDay.queueAt(island, endMinute - 1);

			for (int minute = bgnMinute; minute < endMinute; minute++) {
				maxIslandQueue = Math.max(maxIslandQueue, queueDay.queueAt(island, minute) + sbdDay.queueAt(island, minute));
			}
		}

		int prcsPsgCnt = cc.getPrcsPsgCnt() + sbdDay.prcsPsgCnt(bgnMinute, MIN_PER_HOUR);
		long waitSecSum = (long) cc.getAvgWaitSec() * cc.getPrcsPsgCnt() + sbdDay.waitSecSum(bgnMinute, MIN_PER_HOUR);
		long prcsSecSum = (long) cc.getAvgPrcsSec() * cc.getPrcsPsgCnt() + sbdDay.prcsSecSum(bgnMinute, MIN_PER_HOUR);
		DsbdRsltDto result = new DsbdRsltDto();
		result.setTime(hour + "00");
		result.setPsgCnt(fltPsg == null ? 0 : fltPsg.getPsgCnt());
		result.setFcstWtngPsgCnt(maxIslandQueue);
		result.setPrcsPsgCnt(prcsPsgCnt);
		result.setWtngHr(prcsPsgCnt == 0 ? 0 : Math.toIntExact(waitSecSum / prcsPsgCnt / SEC_PER_MIN));
		result.setPrcsHr(prcsPsgCnt == 0 ? 0 : Math.toIntExact(prcsSecSum / prcsPsgCnt / SEC_PER_MIN));
		result.setPrcsRate(SmltUtils.toPrcsRate(prcsPsgCnt, endQueue));
		result.setWtngPsgCnt(psgWtng == null ? null : psgWtng.getWtngPsgCnt());
		result.setLastWeekWtngPsgCnt(lastWeekPsgWtng == null ? 0 : lastWeekPsgWtng.getWtngPsgCnt());

		return result;
	}

	private List<DsbdRsltDto> retrieveDepRsltByTime(String smltId, TerminalKind tmnlId, String excnYmd) {
        String lastWeekYmd = formatYmd(parseYmd(excnYmd).minusDays(7));

		Map<String, SmltRsltRawDto> rsltByHour = castDsbdMapper.retrieveRsltByHourList(smltId, tmnlId.getFcltTmnlId(), DsbdCategory.DEP.getUpPsgFcltCdList())
				.stream().collect(toMap(SmltRsltRawDto::getTime, Function.identity(), (first, ignored) -> first));

		Map<String, PsgWtngRawDto> fcstWtngByHour = castDsbdMapper.retrieveDepFcstWtngByHourList(smltId, tmnlId.getFcltTmnlId())
				.stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper.retrieveFltPsgHourList(excnYmd, tmnlId.getFltTmnlIdList())
				.stream().collect(toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

		Map<String, PsgWtngRawDto> psgWtngByHour = castDsbdMapper.retrievePsgWtngDptgtSumByHourList(excnYmd, tmnlId.getFcltTmnlId())
				.stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		Map<String, PsgWtngRawDto> lastWeekPsgWtngByHour = castDsbdMapper.retrievePsgWtngDptgtSumByHourList(lastWeekYmd, tmnlId.getFcltTmnlId())
				.stream().collect(toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		List<DsbdRsltDto> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			DsbdRsltDto row = toRsltDto(
                hour,
                rsltByHour.get(hour + "00"),
                fltPsgByHour.get(hour),
                psgWtngByHour.get(hour + "00"),
                lastWeekPsgWtngByHour.get(hour + "00"),
                DsbdCategory.DEP
			);

			PsgWtngRawDto fcstWtng = fcstWtngByHour.get(hour + "00");
			row.setFcstWtngPsgCnt(fcstWtng == null ? 0 : fcstWtng.getWtngPsgCnt());
			result.add(row);
		}

		return result;
	}

	private DsbdRsltDto toRsltDto(
			String hour,
			SmltRsltRawDto rslt,
			FltPsgRawDto fltPsg,
			PsgWtngRawDto psgWtng,
			PsgWtngRawDto lastWeekPsgWtng,
			DsbdCategory category
	) {
		DsbdRsltDto result = new DsbdRsltDto();
		result.setTime(hour + "00");

		if (fltPsg != null) {
			result.setPsgCnt(category == DsbdCategory.FLT ? fltPsg.getFltCnt() : fltPsg.getPsgCnt());
		}

		if (rslt != null) {
			result.setFcstWtngPsgCnt(rslt.getWtngPsgCnt());
			result.setWtngHr(rslt.getWtngHr() / SEC_PER_MIN);
			result.setPrcsPsgCnt(rslt.getTrnstPsgCnt());
			result.setPrcsHr(rslt.getPrcsHr() / SEC_PER_MIN);
			result.setPrcsRate(SmltUtils.toPrcsRate(rslt.getTrnstPsgCnt(), rslt.getWtngPsgCnt()));
		}

		result.setWtngPsgCnt(psgWtng == null ? null : psgWtng.getWtngPsgCnt());
		result.setLastWeekWtngPsgCnt(lastWeekPsgWtng == null ? 0 : lastWeekPsgWtng.getWtngPsgCnt());

		return result;
	}

	private int getBrdgRate(FltSmryRawDto fltSmry) {
		if (fltSmry.getSeatCnt() == 0) {
			return 0;
		}

		return Math.toIntExact(fltSmry.getBrdgPsgCnt() * 100L / fltSmry.getSeatCnt());
	}

	private IslandMainAln retrieveIslandMainAln(SmltStngDto smltStng, String fcltTmnlId, LocalDateTime bgnDt) {
		String resourceId = smltStng.getCknctAlctnRsrcId();
		
        if (resourceId == null || resourceId.isEmpty()) {
			throw new IllegalStateException("실행 리소스 정보를 찾을 수 없습니다. smltId=" + smltStng.getSmltId() + ", column=CKNCT_ALCTN_RSRC_ID");
		}

		List<ChknAlnAssignmentRawDto> assignmentList = castDsbdMapper.retrieveChknAlnAssignmentList(smltStng.getExcnYmd(), fcltTmnlId, bgnDt, resourceId);
		Map<String, Integer> openCountMap = new LinkedHashMap<>();
		Map<String, Integer> assignedCountMap = new LinkedHashMap<>();
		Map<String, AssignmentSummary> mainAlnMap = new LinkedHashMap<>();

		for (ChknAlnAssignmentRawDto assignment : assignmentList) {
			String unitCd = normalizeUnitCd(assignment.getUnitCd());
			String alnCd = assignment.getAlnCd() != null ? assignment.getAlnCd().trim() : EMPTY;
			String alnNm = assignment.getAlnNm() != null ? assignment.getAlnNm().trim() : EMPTY;

			if (unitCd.isEmpty() || alnCd.isEmpty() || assignment.getAssignedCnt() <= 0) {
				continue;
			}

			Integer previousOpenCount = openCountMap.putIfAbsent(unitCd, assignment.getOpenCnt());
			if (previousOpenCount != null && previousOpenCount != assignment.getOpenCnt()) {
				throw new IllegalStateException(
						"체크인 운영 카운터 수가 일치하지 않습니다. "
								+ "smltId=" + smltStng.getSmltId()
								+ ", tmnlId=" + fcltTmnlId
								+ ", resourceId=" + resourceId
								+ ", unitCd=" + unitCd);
			}
			assignedCountMap.merge(unitCd, assignment.getAssignedCnt(), Integer::sum);
			AssignmentSummary candidate = new AssignmentSummary(alnCd, alnNm, assignment.getAssignedCnt());
			AssignmentSummary current = mainAlnMap.get(unitCd);

			if (current == null || MAIN_ALN_ORDER.compare(candidate, current) < 0) {
				mainAlnMap.put(unitCd, candidate);
			}
		}

		assignedCountMap.forEach((unitCd, assignedCount) -> {
			int openCount = openCountMap.getOrDefault(unitCd, 0);
			if (assignedCount > openCount) {
				throw new IllegalStateException(
						"하나의 체크인카운터에 여러 항공사가 중복 배정되었습니다. "
								+ "smltId=" + smltStng.getSmltId()
								+ ", tmnlId=" + fcltTmnlId
								+ ", resourceId=" + resourceId
								+ ", unitCd=" + unitCd
								+ ", openCount=" + openCount
								+ ", assignedCount=" + assignedCount);
			}
		});

		return new IslandMainAln(mainAlnMap);
	}

	private String normalizeUnitCd(String unitCd) {
		return unitCd != null ? unitCd.trim() : EMPTY;
	}

	private String baseContext(String smltId, TerminalKind tmnlId, String hhmm) {
		return "smltId=" + smltId + ", tmnlId=" + (tmnlId != null ? tmnlId.getValue() : null) + ", hhmm=" + hhmm;
	}

	private String unitContext(String baseContext, FcltType fcltType, String unitCd) {
		return baseContext + ", fcltType=" + fcltType.getValue() + ", unitCd=" + unitCd;
	}

	// 재계산 주기가 확인되지 않아 다음 정시를 예정 시각으로 본다
	private String getNextCalcDt(String lastCalcDt) {
		if (lastCalcDt == null || lastCalcDt.length() != DT_FORMAT.length()) {
			return EMPTY;
		}

		LocalDateTime lastCalc = LocalDateTime.parse(lastCalcDt, DateTimeFormatter.ofPattern(DT_FORMAT));

		return lastCalc.plusHours(1).withMinute(0).withSecond(0).format(DateTimeFormatter.ofPattern(DT_FORMAT));
	}

	private String getEndHhmm(String bgnHhmm, int intrvlMin) {
		int endMin = toMinutes(bgnHhmm) + intrvlMin;

		return endMin >= MIN_PER_DAY
				? "2400"
				: toHhmm(endMin);
	}

	private int toMinutes(String hhmm) {
		return Integer.parseInt(hhmm.substring(0, 2)) * MIN_PER_HOUR
				+ Integer.parseInt(hhmm.substring(2, 4));
	}

	private String toHhmm(int minutes) {
		return String.format("%02d%02d", minutes / MIN_PER_HOUR, minutes % MIN_PER_HOUR);
	}

	private LocalDate parseYmd(String ymd) {
		return LocalDate.parse(ymd, DateTimeFormatter.ofPattern(YMD_FORMAT));
	}

	private String formatYmd(LocalDate date) {
		return date.format(DateTimeFormatter.ofPattern(YMD_FORMAT));
	}
}
