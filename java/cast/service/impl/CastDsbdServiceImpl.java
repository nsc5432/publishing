package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueRecommend;
import aoms.pm.cast.domains.chkn.ChknQueueSlot;
import aoms.pm.cast.domains.chkn.ChknSbdDay;
import aoms.pm.cast.domains.dsbd.AssignmentSummary;
import aoms.pm.cast.domains.dsbd.RecommendationContext;
import aoms.pm.cast.domains.dsbd.RecommendationResources;
import aoms.pm.cast.domains.dsbd.RollingRange;
import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.ChknAlnAssignmentRawDto;
import aoms.pm.cast.dto.DowAttrDto;
import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
import aoms.pm.cast.dto.DsbdRsltDto;
import aoms.pm.cast.dto.DsbdSearchDto;
import aoms.pm.cast.dto.FcltQueueScenarioDto;
import aoms.pm.cast.dto.FcltQueueScenarioSearchDto;
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
import aoms.pm.cast.service.CastCgnGradeService;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastDsbdService;
import aoms.pm.cast.service.CastFcltQueueScenarioService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.FcltRecommendationCalculator;
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
	private static final int FCLT_ROLLING_MIN = 60;
	private static final int CAST_SLOT_MIN = 10;
	private static final int RECOMMEND_LEAD_MIN = 10;
	private static final int CARD_SLOT_MIN = 30;

	private final CastDsbdMapper castDsbdMapper;
	private final CastFltPsgMapper castFltPsgMapper;
	private final CastSmltService castSmltService;
	private final CastChknQueueService castChknQueueService;
	private final CastCgnGradeService castCgnGradeService;
	private final CastFcltQueueScenarioService castFcltQueueScenarioService;

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
		result.setAvlTimes(castDsbdMapper.retrieveAvlTimeList(smltId));

		return result;
	}

	@Override
	public DsbdHeaderDto retrieveDailySmltHeader(DsbdSearchDto searchDto) {
		DsbdHeaderDto result = new DsbdHeaderDto();
		String ymd = searchDto.getYmd();

		// 운항계획 카드는 공항 전체다. 터미널 목록을 주지 않으면 매퍼가 터미널 조건을 걸지 않는다
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
		PeakDto peak = getPeak(searchDto.getSmltId(), tmnlId);
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(peak.getWtngPsgCnt()));
		result.setPeak(peak);

		int intrvlMin = searchDto.getIntrvlMin() != null ? searchDto.getIntrvlMin() : DEFAULT_INTRVL_MIN;
		String bgnHhmm = searchDto.getHhmm();

		result.setIntrvlMin(intrvlMin);

		if (bgnHhmm != null && bgnHhmm.length() == 4) {
			String endHhmm = getEndHhmm(bgnHhmm, intrvlMin);
			FltSmryRawDto baseIntrvl = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate), fltTmnlIdList, bgnHhmm, endHhmm);
			FltSmryRawDto yesterdayIntrvl = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate.minusDays(1)), fltTmnlIdList, bgnHhmm, endHhmm);

			result.setIntrvlFltCnt(baseIntrvl.getDepFltCnt());
			result.setIntrvlPsgCnt(baseIntrvl.getDepPsgCnt());
			result.setIntrvlYesterdayFltDiffCnt(baseIntrvl.getDepFltCnt() - yesterdayIntrvl.getDepFltCnt());
			result.setIntrvlYesterdayPsgDiffCnt(baseIntrvl.getDepPsgCnt() - yesterdayIntrvl.getDepPsgCnt());
		}

		return result;
	}

	@Override
	public List<DsbdRsltDto> retrieveDailySmltTmnlRsltByTime(DsbdSearchDto searchDto) {
		DsbdCategory category = searchDto.getCategory();
		TerminalKind tmnlId = searchDto.getTmnlId();

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		if (category == DsbdCategory.CHKN) {
			return retrieveChknRsltByTime(searchDto.getSmltId(), tmnlId, smltStng.getExcnYmd());
		}

		Map<String, SmltRsltRawDto> rsltByHour = castDsbdMapper
				.retrieveRsltByHourList(searchDto.getSmltId(), tmnlId.getFcltTmnlId(), category.getUpPsgFcltCdList())
				.stream().collect(Collectors.toMap(SmltRsltRawDto::getTime, Function.identity(), (first, ignored) -> first));

		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper
				.retrieveFltPsgHourList(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList())
				.stream().collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

		Map<String, PsgWtngRawDto> psgWtngByHour = castDsbdMapper
				.retrievePsgWtngByHourList(smltStng.getExcnYmd(), tmnlId.getFcltTmnlId(), category.getPsgWtngFcltTypeCdList())
				.stream().collect(Collectors.toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		String lastWeekYmd = formatYmd(parseYmd(smltStng.getExcnYmd()).minusDays(7));
		Map<String, PsgWtngRawDto> lastWeekPsgWtngByHour = castDsbdMapper
				.retrievePsgWtngByHourList(lastWeekYmd, tmnlId.getFcltTmnlId(), category.getPsgWtngFcltTypeCdList())
				.stream().collect(Collectors.toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

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

		if (fcltType != FcltType.DEP) {
			return getChknFcltCardList(searchDto);
		}

		TerminalKind tmnlId = searchDto.getTmnlId();
		String smltId = searchDto.getSmltId();
		String hhmm = searchDto.getHhmm();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String baseContext = baseContext(smltId, tmnlId, hhmm);

		List<String> cardFcltCdList = List.of("LGT", "SC", "SR");
		Set<String> recommendFcltCdSet = Set.of("SC", "SR");
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(smltId);
		RollingRange range = getRollingRange(smltStng.getExcnYmd(), hhmm);
		List<SmltRsltRawDto> unitTimeResultList = castDsbdMapper.retrieveRsltByUnitList(smltId, fcltTmnlId, range.getBgnDt(), range.getEndDt(), null, cardFcltCdList);

		Map<String, List<SmltRsltRawDto>> displayUnitTimeMap = mergeUnitTimesByUnit(unitTimeResultList, Set.copyOf(cardFcltCdList));
		Map<String, List<SmltRsltRawDto>> recommendUnitTimeMap = mergeUnitTimesByUnit(unitTimeResultList, recommendFcltCdSet);
		Map<String, SmltRsltRawDto> displayRsltMap = aggregateByUnit(displayUnitTimeMap);
		Map<String, SmltRsltRawDto> recommendRsltMap = aggregateByUnit(recommendUnitTimeMap);

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, cardFcltCdList)
				.stream().collect(Collectors.toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		CgnGradeScale gradeScale = castCgnGradeService.retrieveGradeScale(fcltType, baseContext);
		RecommendationContext recommendationContext = new RecommendationContext(
				fcltType,
				range,
				dt -> getRecommendationResources(fcltType, smltStng, fcltTmnlId, dt),
				() -> getPriorSlotMap(smltId, fcltTmnlId, recommendFcltCdSet, range));

		RecommendationResources resources = recommendationContext.getRecommendationResourcesAt(range.getBgnDt());
		BigDecimal averageServiceRate = getAverageServiceRate(recommendRsltMap, resources, range);
		List<FcltUnitDto> unitList = getUnitList(unitMap, recommendRsltMap, gradeScale, baseContext);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		List<SmltRsltRawDto> sortedRsltList = displayRsltMap.values().stream().sorted(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt).reversed()).collect(toList());

		for (SmltRsltRawDto rslt : sortedRsltList) {
			String unitCd = rslt.getUnitCd();
			String unitContext = recommendContext(baseContext, fcltType, unitCd);
			SmltRsltRawDto recommendRslt = recommendRsltMap.get(unitCd);
			FcltRecommendationCalculator.Result calculation = null;

			if (recommendRslt != null) {
				List<SmltRsltRawDto> unitTimeList = recommendUnitTimeMap.get(unitCd);
				PeakUnitTime peak = getPeakUnitTime(unitTimeList, range, unitContext);
				int currentOpenCount = resources.getOpenCountValue(unitCd);

				BigDecimal serviceRate = getServiceRate(recommendationContext, unitCd, recommendRslt.getTrnstPsgCnt(), currentOpenCount, averageServiceRate);
				calculation = calculateRecommendation(unitTimeList, peak, serviceRate, gradeScale, range, currentOpenCount, unitContext);
			}

			String targetName = calculation == null ? EMPTY : resources.getTargetName(unitCd, unitContext);

			result.add(getFcltCard(rslt, recommendRslt != null ? recommendRslt.getWtngPsgCnt() : 0, unitMap.get(unitCd), unitList, targetName, calculation, gradeScale, range));
		}

		return result;
	}

	@Override
	public FcltQueueScenarioDto retrieveFcltQueueScenario(FcltQueueScenarioSearchDto searchDto) {
		return castFcltQueueScenarioService.retrieveFcltQueueScenario(searchDto);
	}

	private List<DsbdFcltCardDto> getChknFcltCardList(DsbdSearchDto searchDto) {
		TerminalKind tmnlId = searchDto.getTmnlId();
		String smltId = searchDto.getSmltId();
		String hhmm = searchDto.getHhmm();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String baseContext = baseContext(smltId, tmnlId, hhmm);

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(smltId);
		RollingRange range = getRollingRange(smltStng.getExcnYmd(), hhmm);
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltId, tmnlId, smltStng.getExcnYmd());
		RecommendationResources resources = getRecommendationResources(FcltType.CHKN, smltStng, fcltTmnlId, range.getBgnDt());

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, List.of("CC", "CK", "SBD"))
				.stream().collect(Collectors.toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		int bgnMinute = toMinutes(hhmm);
		List<FcltUnitDto> unitList = getChknUnitList(unitMap, queueDay, bgnMinute, baseContext);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (String unitCd : sortedByQueue(queueDay, bgnMinute)) {
			result.add(getChknFcltCard(unitCd, queueDay, bgnMinute, range, unitMap.get(unitCd), unitList, resources, baseContext));
		}

		return result;
	}

	private List<String> sortedByQueue(ChknQueueDay queueDay, int bgnMinute) {
		List<String> result = new ArrayList<>();

		for (String unitCd : queueDay.islandCdList()) {
			ChknQueueSlot slot = queueDay.slotOf(unitCd, bgnMinute, CARD_SLOT_MIN);

			if (slot.getCurrentQueue() > 0 || slot.getPrcsPsgCnt() > 0 || slot.getOprBoothCnt() > 0) {
				result.add(unitCd);
			}
		}

		result.sort(Comparator.comparingInt((String unitCd) -> queueDay.slotOf(unitCd, bgnMinute, CARD_SLOT_MIN).getCurrentQueue()).reversed());

		return result;
	}

	private List<FcltUnitDto> getChknUnitList(
			Map<String, FcltUnitRawDto> unitMap,
			ChknQueueDay queueDay,
			int bgnMinute,
			String baseContext
	) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = normalizeUnitCd(unit.getUnitCd());

			if (unitCd.isEmpty()) {
				continue;
			}

			result.add(new FcltUnitDto()
					.withUnitCd(unitCd)
					.withCgnStatus(queueDay.statusOf(
							queueDay.slotOf(unitCd, bgnMinute, CARD_SLOT_MIN).getCurrentQueue(),
							gradeContext(baseContext, unitCd)))
					.withUseYn(unit.getOprCnt() > 0 ? "Y" : "N"));
		}

		return result;
	}

	private DsbdFcltCardDto getChknFcltCard(String unitCd, ChknQueueDay queueDay, int bgnMinute, RollingRange range, FcltUnitRawDto unit, List<FcltUnitDto> unitList, RecommendationResources resources, String baseContext) {
		ChknQueueSlot slot = queueDay.slotOf(unitCd, bgnMinute, CARD_SLOT_MIN);
		ChknQueueSlot rollingSlot = queueDay.slotOf(unitCd, bgnMinute, range.getActualMinutes());
		ChknQueueRecommend recommend = queueDay.recommendOf(unitCd, bgnMinute, CARD_SLOT_MIN);
		int queuePsgCnt = slot.getCurrentQueue();
		String targetName = recommend.getReqCnt() == null ? EMPTY : resources.getTargetName(unitCd, recommendContext(baseContext, FcltType.CHKN, unitCd));

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(FcltType.CHKN.getValue() + "-" + unitCd);
		result.setFcltType(FcltType.CHKN);
		result.setIsland(unitCd);
		result.setDptgtNo(EMPTY);
		result.setFcltNm(unitCd);
		result.setTotCnt(unit != null ? unit.getTotCnt() : 0);
		result.setOprCnt(unit != null ? unit.getOprCnt() : 0);
		result.setWtngPsgCnt(queuePsgCnt);
		result.setHrlyPrcsPsgCnt(toPaxPerMin(rollingSlot.getPrcsPsgCnt(), range.getActualMinutes()));
		result.setHrlyPrcsRate(SmltUtils.toPrcsRate(rollingSlot.getPrcsPsgCnt(), queuePsgCnt));
		result.setCgnClearTime(recommend.getCgnClearMin() == null
				? EMPTY
				: range.getBgnDt().plusMinutes(recommend.getCgnClearMin()).format(DateTimeFormatter.ofPattern("HHmm")));
		result.setCgnClearRate(toChknClearRate(recommend, slot.getOprBoothCnt(), range));
		result.setCgnStatus(queueDay.statusOf(queuePsgCnt, gradeContext(baseContext, unitCd)));
		result.setRecommend(getChknRecommend(targetName, recommend, slot.getOprBoothCnt()));
		result.setUnitList(unitList);

		return result;
	}

	private FcltRecommendDto getChknRecommend(String targetName, ChknQueueRecommend recommend, int oprBoothCnt) {
		Integer reqCnt = recommend.getReqCnt();
		boolean needAssign = reqCnt != null && reqCnt > oprBoothCnt && !targetName.isEmpty();

		FcltRecommendDto result = new FcltRecommendDto();
		result.setTargetNm(targetName);
		result.setReqCnt(reqCnt == null ? 0 : reqCnt);
		result.setNeedAssignYn(needAssign ? "Y" : "N");

		return result;
	}

	private int toChknClearRate(ChknQueueRecommend recommend, int oprBoothCnt, RollingRange range) {
		Integer clearMin = recommend.getCgnClearMin();
		Integer reqCnt = recommend.getReqCnt();

		if (clearMin == null || reqCnt == null || reqCnt <= oprBoothCnt) {
			return 0;
		}

		int remainingMinutes = Math.max(range.getActualMinutes() - clearMin, 0);

		return BigDecimal.valueOf(remainingMinutes)
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(range.getActualMinutes()), 0, RoundingMode.HALF_UP)
				.intValueExact();
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
				.stream().collect(Collectors.toMap(PsgDptcnyTrnsPrfmncRawDto::getHour, Function.identity(), (first, ignored) -> first));
		Map<String, BdpsgAnceRawDto> fcstMap = castDsbdMapper.retrieveHourlyBdpsgAnceList(ymd, tmnlId.getFltTmnlIdList())
				.stream().collect(Collectors.toMap(BdpsgAnceRawDto::getHour, Function.identity(), (first, ignored) -> first));

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
	private List<DsbdRsltDto> retrieveChknRsltByTime(String smltId, TerminalKind tmnlId, String excnYmd) {
		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper
            .retrieveFltPsgHourList(excnYmd, tmnlId.getFltTmnlIdList())
            .stream().collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

        // Cast Queue
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltId, tmnlId, excnYmd);
		ChknSbdDay sbdDay = castChknQueueService.retrieveChknSbdDay(smltId, tmnlId, excnYmd);
		Set<String> islandCdSet = new LinkedHashSet<>(queueDay.islandCdList());
		islandCdSet.addAll(sbdDay.islandCdList());

        // Xovis Queue
        String lastWeekYmd = formatYmd(parseYmd(excnYmd).minusDays(7));
		Map<String, PsgWtngRawDto> psgWtngByHour = castDsbdMapper
            .retrievePsgWtngIslSumByHourList(excnYmd, tmnlId.getFcltTmnlId())
            .stream().collect(Collectors.toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));
		
        Map<String, PsgWtngRawDto> lastWeekPsgWtngByHour = castDsbdMapper
            .retrievePsgWtngIslSumByHourList(lastWeekYmd, tmnlId.getFcltTmnlId())
            .stream().collect(Collectors.toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));
	
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
		ChknQueueSlot cc = queueDay.tmnlSeries().slotOf(bgnMinute, MIN_PER_HOUR);
		int maxQueue = 0;
		int endQueue = cc.getCurrentQueue();

		for (String island : islandCdSet) {
			endQueue += sbdDay.queueAt(island, endMinute - 1);

			for (int minute = bgnMinute; minute < endMinute; minute++) {
				maxQueue = Math.max(maxQueue, queueDay.queueAt(island, minute) + sbdDay.queueAt(island, minute));
			}
		}

		int prcsPsgCnt = cc.getPrcsPsgCnt() + sbdDay.prcsPsgCnt(bgnMinute, MIN_PER_HOUR);
		long waitSecSum = (long) cc.getAvgWaitSec() * cc.getPrcsPsgCnt() + sbdDay.waitSecSum(bgnMinute, MIN_PER_HOUR);
		long prcsSecSum = (long) cc.getAvgPrcsSec() * cc.getPrcsPsgCnt() + sbdDay.prcsSecSum(bgnMinute, MIN_PER_HOUR);
		DsbdRsltDto result = new DsbdRsltDto();
		result.setTime(hour + "00");
		result.setPsgCnt(fltPsg == null ? 0 : fltPsg.getPsgCnt());
		result.setFcstWtngPsgCnt(maxQueue);
		result.setPrcsPsgCnt(prcsPsgCnt);
		result.setWtngHr(prcsPsgCnt == 0 ? 0 : Math.toIntExact(waitSecSum / prcsPsgCnt / SEC_PER_MIN));
		result.setPrcsHr(prcsPsgCnt == 0 ? 0 : Math.toIntExact(prcsSecSum / prcsPsgCnt / SEC_PER_MIN));
		result.setPrcsRate(SmltUtils.toPrcsRate(prcsPsgCnt, endQueue));
		result.setWtngPsgCnt(psgWtng == null ? null : psgWtng.getWtngPsgCnt());
		result.setLastWeekWtngPsgCnt(lastWeekPsgWtng == null ? 0 : lastWeekPsgWtng.getWtngPsgCnt());

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

		// 측정값이 없는 시간대는 0 이 아니라 null 이다 — 실적선을 끊어 그린다
		result.setWtngPsgCnt(psgWtng == null ? null : psgWtng.getWtngPsgCnt());

		result.setLastWeekWtngPsgCnt(lastWeekPsgWtng == null ? 0 : lastWeekPsgWtng.getWtngPsgCnt());

		return result;
	}

	private Map<String, List<SmltRsltRawDto>> mergeUnitTimesByUnit(List<SmltRsltRawDto> rawSlotList, Set<String> upPsgFcltCdSet) {
		Map<String, Map<LocalDateTime, SmltRsltRawDto>> unitTimeMap = new LinkedHashMap<>();

		for (SmltRsltRawDto raw : rawSlotList) {
			if (!upPsgFcltCdSet.contains(raw.getUpPsgFcltCd())) {
				continue;
			}

			String unitCd = normalizeUnitCd(raw.getUnitCd());

			if (unitCd.isEmpty() || raw.getSmltActlDt() == null) {
				continue;
			}

			Map<LocalDateTime, SmltRsltRawDto> timeMap = unitTimeMap.computeIfAbsent(unitCd, ignored -> new TreeMap<>());
			SmltRsltRawDto slot = timeMap.get(raw.getSmltActlDt());

			if (slot == null) {
				timeMap.put(raw.getSmltActlDt(), newSlot(raw, unitCd));
				continue;
			}

			slot.setWtngPsgCnt(slot.getWtngPsgCnt() + raw.getWtngPsgCnt());
			slot.setTrnstPsgCnt(slot.getTrnstPsgCnt() + raw.getTrnstPsgCnt());
			slot.setWtngHr(Math.max(slot.getWtngHr(), raw.getWtngHr()));
			slot.setPrcsHr(Math.max(slot.getPrcsHr(), raw.getPrcsHr()));
		}

		Map<String, List<SmltRsltRawDto>> result = new LinkedHashMap<>();
		unitTimeMap.forEach((unitCd, timeMap) -> result.put(unitCd, new ArrayList<>(timeMap.values())));
		return result;
	}

	private SmltRsltRawDto newSlot(SmltRsltRawDto raw, String unitCd) {
		SmltRsltRawDto result = new SmltRsltRawDto();
		result.setTime(raw.getTime());
		result.setSmltActlDt(raw.getSmltActlDt());
		result.setUnitCd(unitCd);
		result.setWtngPsgCnt(raw.getWtngPsgCnt());
		result.setTrnstPsgCnt(raw.getTrnstPsgCnt());
		result.setWtngHr(raw.getWtngHr());
		result.setPrcsHr(raw.getPrcsHr());
		return result;
	}

	private Map<String, SmltRsltRawDto> aggregateByUnit(Map<String, List<SmltRsltRawDto>> slotMap) {
		Map<String, SmltRsltRawDto> result = new LinkedHashMap<>();

		slotMap.forEach((unitCd, slots) -> {
			SmltRsltRawDto aggregate = new SmltRsltRawDto();
			aggregate.setUnitCd(unitCd);
			for (SmltRsltRawDto slot : slots) {
				aggregate.setWtngPsgCnt(Math.max(aggregate.getWtngPsgCnt(), slot.getWtngPsgCnt()));
				aggregate.setTrnstPsgCnt(aggregate.getTrnstPsgCnt() + slot.getTrnstPsgCnt());
				aggregate.setWtngHr(Math.max(aggregate.getWtngHr(), slot.getWtngHr()));
				aggregate.setPrcsHr(Math.max(aggregate.getPrcsHr(), slot.getPrcsHr()));
			}
			result.put(unitCd, aggregate);
		});

		return result;
	}

	private List<FcltUnitDto> getUnitList(
			Map<String, FcltUnitRawDto> unitMap,
			Map<String, SmltRsltRawDto> recommendRsltMap,
			CgnGradeScale gradeScale,
			String baseContext
	) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = normalizeUnitCd(unit.getUnitCd());

			if (unitCd.isEmpty()) {
				continue;
			}

			SmltRsltRawDto rslt = recommendRsltMap.get(unitCd);
			int wtngPsgCnt = rslt != null ? rslt.getWtngPsgCnt() : 0;

			result.add(new FcltUnitDto()
					.withUnitCd(unitCd)
					.withCgnStatus(gradeScale.statusOf(
							wtngPsgCnt,
							gradeContext(baseContext, unitCd)))
					.withUseYn(unit.getOprCnt() > 0 ? "Y" : "N"));
		}

		return result;
	}

	private DsbdFcltCardDto getFcltCard(
			SmltRsltRawDto displayRslt,
			int cgnWtngPsgCnt,
			FcltUnitRawDto unit,
			List<FcltUnitDto> unitList,
			String targetName,
			FcltRecommendationCalculator.Result calculation,
			CgnGradeScale gradeScale,
			RollingRange range
	) {
		String unitCd = displayRslt.getUnitCd();

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(FcltType.DEP.getValue() + "-" + unitCd);
		result.setFcltType(FcltType.DEP);
		result.setIsland(EMPTY);
		result.setDptgtNo(unitCd);
		result.setFcltNm(unitCd + "번");
		result.setTotCnt(unit != null ? unit.getTotCnt() : 0);
		result.setOprCnt(unit != null ? unit.getOprCnt() : 0);
		result.setWtngPsgCnt(displayRslt.getWtngPsgCnt());
		result.setHrlyPrcsPsgCnt(toPaxPerMin(displayRslt.getTrnstPsgCnt(), range.getActualMinutes()));
		result.setHrlyPrcsRate(SmltUtils.toPrcsRate(displayRslt.getTrnstPsgCnt(), displayRslt.getWtngPsgCnt()));
		result.setCgnClearTime(calculation == null ? EMPTY : range.getBgnDt().plusMinutes(calculation.getClearMinutes()).format(DateTimeFormatter.ofPattern("HHmm")));
		result.setCgnClearRate(toClearRate(calculation, range));
		result.setCgnStatus(gradeScale.statusOf(cgnWtngPsgCnt, "unitCd=" + unitCd));
		result.setRecommend(getRecommend(targetName, calculation == null ? 0 : calculation.getReqCnt()));
		result.setUnitList(unitList);

		return result;
	}

	private FcltRecommendDto getRecommend(String targetName, int reqCnt) {
		FcltRecommendDto result = new FcltRecommendDto();

		result.setTargetNm(targetName);
		result.setReqCnt(reqCnt);
		result.setNeedAssignYn("N");

		return result;
	}

	private int toClearRate(FcltRecommendationCalculator.Result calculation, RollingRange range) {
		if (calculation == null || calculation.getExtraCnt() == 0) {
			return 0;
		}

		int remainingMinutes = Math.max(range.getActualMinutes() - calculation.getClearMinutes(), 0);

		return BigDecimal.valueOf(remainingMinutes)
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(range.getActualMinutes()), 0, RoundingMode.HALF_UP)
				.intValueExact();
	}

	private int toPaxPerMin(int processedPsgCnt, int actualMinutes) {
		return BigDecimal.valueOf(processedPsgCnt)
				.divide(BigDecimal.valueOf(actualMinutes), 0, RoundingMode.HALF_UP)
				.intValueExact();
	}

	private int getBrdgRate(FltSmryRawDto fltSmry) {
		if (fltSmry.getRsvtBrdgPsgCnt() == 0) {
			return 0;
		}

		return BigDecimal.valueOf(fltSmry.getActlBrdgPsgCnt())
				.multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(fltSmry.getRsvtBrdgPsgCnt()), 0, RoundingMode.HALF_UP)
				.intValueExact();
	}

	private RollingRange getRollingRange(String excnYmd, String hhmm) {
		LocalDate baseDate = parseYmd(excnYmd);
		LocalDateTime dayStart = baseDate.atStartOfDay();
		LocalDateTime dayEnd = dayStart.plusDays(1);
		LocalDateTime bgnDt = LocalDateTime.of(baseDate, LocalTime.parse(hhmm, DateTimeFormatter.ofPattern("HHmm")));
		LocalDateTime endDt = bgnDt.plusMinutes(FCLT_ROLLING_MIN).isBefore(dayEnd)
				? bgnDt.plusMinutes(FCLT_ROLLING_MIN)
				: dayEnd;
		int actualMinutes = Math.toIntExact(Duration.between(bgnDt, endDt).toMinutes());

		if (actualMinutes <= 0) {
			throw new IllegalArgumentException("시설 집계 구간이 올바르지 않습니다. excnYmd=" + excnYmd + ", hhmm=" + hhmm);
		}

		return new RollingRange(dayStart, bgnDt, endDt, actualMinutes);
	}

	private RecommendationResources getRecommendationResources(FcltType fcltType, SmltStngDto smltStng, String fcltTmnlId, LocalDateTime bgnDt) {
		if (fcltType == FcltType.DEP) {
			String resourceId = smltStng.getFcltyOpngScrtyCntrlRsrcId();
			requireResourceId(resourceId, "FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID", smltStng);
			Map<String, Integer> openCountMap = new LinkedHashMap<>();
			for (FcltUnitRawDto raw : castDsbdMapper.retrieveScrtyOpenCountList(fcltTmnlId, resourceId)) {
				String unitCd = normalizeUnitCd(raw.getUnitCd());
				if (raw.getTotCnt() != 1) {
					throw new IllegalStateException(
							"보안검색대 운영 snapshot 에 같은 게이트 행이 둘 이상입니다. "
									+ "smltId=" + smltStng.getSmltId()
									+ ", tmnlId=" + fcltTmnlId
									+ ", resourceId=" + resourceId
									+ ", unitCd=" + unitCd
									+ ", rowCount=" + raw.getTotCnt());
				}
				openCountMap.put(unitCd, raw.getOprCnt());
			}
			return new RecommendationResources(openCountMap, Map.of(), "보안검색대");
		}

		String resourceId = smltStng.getCknctAlctnRsrcId();
		requireResourceId(resourceId, "CKNCT_ALCTN_RSRC_ID", smltStng);
		List<ChknAlnAssignmentRawDto> assignmentList = castDsbdMapper.retrieveChknAlnAssignmentList(smltStng.getExcnYmd(), fcltTmnlId, bgnDt, resourceId);
		Map<String, Integer> openCountMap = new LinkedHashMap<>();
		Map<String, Integer> assignedCountMap = new LinkedHashMap<>();
		Map<String, AssignmentSummary> targetMap = new LinkedHashMap<>();

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
			AssignmentSummary current = targetMap.get(unitCd);
			if (current == null
					|| assignment.getAssignedCnt() > current.getAssignedCount()
					|| assignment.getAssignedCnt() == current.getAssignedCount() && alnCd.compareTo(current.getAlnCd()) < 0) {
				targetMap.put(unitCd, new AssignmentSummary(alnCd, alnNm, assignment.getAssignedCnt()));
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

		return new RecommendationResources(openCountMap, targetMap, null);
	}

	private Map<String, List<SmltRsltRawDto>> getPriorSlotMap(
			String smltId,
			String fcltTmnlId,
			Set<String> recommendFcltCdSet,
			RollingRange range
	) {
		List<SmltRsltRawDto> priorRawList = castDsbdMapper.retrieveRsltByUnitList(
				smltId,
				fcltTmnlId,
				range.getServiceRateLookbackBgn(),
				range.getBgnDt(),
				null,
				new ArrayList<>(recommendFcltCdSet));

		return mergeUnitTimesByUnit(priorRawList, recommendFcltCdSet);
	}

	private void requireResourceId(String resourceId, String columnName, SmltStngDto smltStng) {
		if (resourceId == null || resourceId.isEmpty()) {
			throw new IllegalStateException("실행 리소스 정보를 찾을 수 없습니다. smltId=" + smltStng.getSmltId() + ", column=" + columnName);
		}
	}

	private PeakUnitTime getPeakUnitTime(
			List<SmltRsltRawDto> slotList,
			RollingRange range,
			String context
	) {
		LocalDateTime windowBgn = range.getBgnDt().plusMinutes(RECOMMEND_LEAD_MIN);
		SmltRsltRawDto peak = null;

		if (slotList != null) {
			for (SmltRsltRawDto slot : slotList) {
				LocalDateTime slotDt = slot.getSmltActlDt();

				if (slotDt.isBefore(windowBgn) || slotDt.isAfter(range.getEndDt())) {
					continue;
				}

				// 동률이면 이른 시각을 택한다 — 리드타임이 짧아져 안전측으로 산정된다
				if (peak == null || slot.getWtngPsgCnt() > peak.getWtngPsgCnt()) {
					peak = slot;
				}
			}
		}

		if (peak == null) {
			throw new IllegalStateException(
					"추천 리드타임 이후의 결과가 없습니다. "
							+ context
							+ ", windowBgn=" + windowBgn
							+ ", endDt=" + range.getEndDt());
		}

		return new PeakUnitTime(
				peak.getWtngPsgCnt(),
				Math.toIntExact(Duration.between(range.getBgnDt(), peak.getSmltActlDt()).toMinutes()));
	}

	private List<FcltRecommendationCalculator.QueuePoint> getTrajectory(
			List<SmltRsltRawDto> slotList,
			RollingRange range
	) {
		List<FcltRecommendationCalculator.QueuePoint> result = new ArrayList<>();

		for (SmltRsltRawDto slot : slotList) {
			if (slot.getSmltActlDt().isAfter(range.getEndDt())) {
				continue;
			}

			result.add(new FcltRecommendationCalculator.QueuePoint(
					Math.toIntExact(Duration.between(range.getBgnDt(), slot.getSmltActlDt()).toMinutes()),
					slot.getWtngPsgCnt()));
		}

		return result;
	}

	private BigDecimal getServiceRate(
			RecommendationContext context,
			String unitCd,
			int processedPsgCnt,
			int currentOpenCount,
			BigDecimal averageServiceRate
	) {
		if (currentOpenCount > 0 && processedPsgCnt > 0) {
			return calculateServiceRate(processedPsgCnt, currentOpenCount, context.getRange().getActualMinutes());
		}

		List<SmltRsltRawDto> priorSlotList = context.priorSlotsOf(unitCd);

		for (int index = priorSlotList.size() - 1; index >= 0; index--) {
			SmltRsltRawDto slot = priorSlotList.get(index);
			if (slot.getTrnstPsgCnt() <= 0) {
				continue;
			}

			int priorOpenCount = context.getRecommendationResourcesAt(slot.getSmltActlDt()).getOpenCountValue(unitCd);
			if (priorOpenCount > 0) {
				return calculateServiceRate(slot.getTrnstPsgCnt(), priorOpenCount, CAST_SLOT_MIN);
			}
		}

		return averageServiceRate;
	}

	private BigDecimal getAverageServiceRate(
			Map<String, SmltRsltRawDto> recommendRsltMap,
			RecommendationResources resources,
			RollingRange range
	) {
		int totalProcessedPsgCnt = 0;
		int totalOpenCount = 0;

		for (Map.Entry<String, SmltRsltRawDto> entry : recommendRsltMap.entrySet()) {
			int openCount = resources.getOpenCountValue(entry.getKey());

			if (openCount <= 0) {
				continue;
			}

			totalProcessedPsgCnt += entry.getValue().getTrnstPsgCnt();
			totalOpenCount += openCount;
		}

		if (totalProcessedPsgCnt <= 0 || totalOpenCount <= 0) {
			return null;
		}

		return calculateServiceRate(totalProcessedPsgCnt, totalOpenCount, range.getActualMinutes());
	}

	private BigDecimal calculateServiceRate(int processedPsgCnt, int openCount, int minutes) {
		return BigDecimal.valueOf(processedPsgCnt)
				.divide(BigDecimal.valueOf(openCount), MathContext.DECIMAL128)
				.divide(BigDecimal.valueOf(minutes), MathContext.DECIMAL128);
	}

	private FcltRecommendationCalculator.Result calculateRecommendation(
			List<SmltRsltRawDto> slotList,
			PeakUnitTime peak,
			BigDecimal serviceRate,
			CgnGradeScale gradeScale,
			RollingRange range,
			int currentOpenCount,
			String context
	) {
		List<FcltRecommendationCalculator.QueuePoint> trajectory = getTrajectory(slotList, range);

		if (serviceRate == null || currentOpenCount <= 0 || trajectory.isEmpty()) {
			return null;
		}

		try {
			return FcltRecommendationCalculator.calculate(
					BigDecimal.valueOf(peak.getQueue()),
					BigDecimal.valueOf(peak.getLeadMinutes()),
					serviceRate,
					gradeScale.getNormalMax(),
					currentOpenCount,
					trajectory);
		} catch (IllegalArgumentException | IllegalStateException exception) {
			throw new IllegalStateException(
					"시설 추천 계산에 실패했습니다. "
							+ context
							+ ", peakQueue=" + peak.getQueue()
							+ ", leadMinutes=" + peak.getLeadMinutes()
							+ ", serviceRate=" + serviceRate
							+ ", currentOpenCount=" + currentOpenCount
							+ ", targetQueue=" + gradeScale.getNormalMax(),
					exception);
		}
	}

	private String normalizeUnitCd(String unitCd) {
		return unitCd != null ? unitCd.trim() : EMPTY;
	}

	private String baseContext(String smltId, TerminalKind tmnlId, String hhmm) {
		return "smltId=" + smltId + ", tmnlId=" + (tmnlId != null ? tmnlId.getValue() : null) + ", hhmm=" + hhmm;
	}

	private String gradeContext(String baseContext, String unitCd) {
		return baseContext + ", unitCd=" + unitCd;
	}

	private String recommendContext(String baseContext, FcltType fcltType, String unitCd) {
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

	private static final class PeakUnitTime {
		private final int queue;
		private final int leadMinutes;

		private PeakUnitTime(int queue, int leadMinutes) {
			this.queue = queue;
			this.leadMinutes = leadMinutes;
		}

		private int getQueue() {
			return queue;
		}

		private int getLeadMinutes() {
			return leadMinutes;
		}
	}
}
