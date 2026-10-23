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
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueSlot;
import aoms.pm.cast.domains.chkn.ChknSbdDay;
import aoms.pm.cast.domains.dsbd.AssignmentSummary;
import aoms.pm.cast.domains.dsbd.DepQueueWindow;
import aoms.pm.cast.domains.dsbd.FcltQueueClearance;
import aoms.pm.cast.domains.dsbd.FcltQueueSource;
import aoms.pm.cast.domains.dsbd.IslandMainAln;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.ChknAlnAssignmentRawDto;
import aoms.pm.cast.dto.DowAttrDto;
import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
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
import aoms.pm.cast.service.CastDepQueueService;
import aoms.pm.cast.service.CastDsbdService;
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
	private static final int CARD_SLOT_MIN = 30;
	private static final String DEP_TARGET_NM = "보안검색대";
	private static final List<String> DEP_CARD_FCLT_CD_LIST = List.of("LGT", "SC", "SR");
	private static final Comparator<AssignmentSummary> MAIN_ALN_ORDER = Comparator.comparingInt(AssignmentSummary::getAssignedCount).reversed().thenComparing(AssignmentSummary::getAlnCd);

	private final CastDsbdMapper castDsbdMapper;
	private final CastFltPsgMapper castFltPsgMapper;
	private final CastSmltService castSmltService;
	private final CastChknQueueService castChknQueueService;
	private final CastDepQueueService castDepQueueService;
	private final CastCgnGradeService castCgnGradeService;

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

		if (fcltType == FcltType.CHKN) {
			return getChknFcltCardList(searchDto);
		}

		TerminalKind tmnlId = searchDto.getTmnlId();
		String smltId = searchDto.getSmltId();
		String hhmm = searchDto.getHhmm();
		String baseContext = baseContext(smltId, tmnlId, hhmm);

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(smltId);
		DepQueueWindow window = castDepQueueService.retrieveDepQueueWindow(smltStng, tmnlId, hhmm);
		CgnGradeScale gradeScale = castCgnGradeService.retrieveGradeScale(fcltType, baseContext);
		int targetQueueCnt = FcltQueueClearance.toTargetQueueCnt(gradeScale.getNormalMax());

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(tmnlId.getFcltTmnlId(), DEP_CARD_FCLT_CD_LIST)
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getDepUnitList(unitMap, window, gradeScale, baseContext);
		List<FcltQueueClearance> clearanceList = window.unitCdList().stream()
				.map(unitCd -> new FcltQueueClearance(window.sourceOf(unitCd), targetQueueCnt))
				.sorted(Comparator.comparingInt((FcltQueueClearance clearance) -> queueOf(clearance.getSource())).reversed())
				.collect(toList());
		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (FcltQueueClearance clearance : clearanceList) {
			String unitCd = clearance.getSource().getUnitCd();

			result.add(getDepFcltCard(clearance, unitMap.get(unitCd), unitList, gradeScale.statusOf(queueOf(clearance.getSource()), gradeContext(baseContext, unitCd))));
		}

		return result;
	}

	private List<DsbdFcltCardDto> getChknFcltCardList(DsbdSearchDto searchDto) {
		TerminalKind tmnlId = searchDto.getTmnlId();
		String smltId = searchDto.getSmltId();
		String hhmm = searchDto.getHhmm();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String baseContext = baseContext(smltId, tmnlId, hhmm);
		int bgnMinute = toMinutes(hhmm);

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(smltId);
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltId, tmnlId, smltStng.getExcnYmd());
		IslandMainAln islandMainAln = retrieveIslandMainAln(smltStng, fcltTmnlId, parseYmd(smltStng.getExcnYmd()).atStartOfDay().plusMinutes(bgnMinute));

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, List.of("CC"))
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getChknUnitList(unitMap, queueDay, bgnMinute, baseContext);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (String unitCd : sortedByQueue(queueDay, bgnMinute)) {
			result.add(getChknFcltCard(unitCd, queueDay, bgnMinute, unitMap.get(unitCd), unitList, islandMainAln, baseContext));
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
        Map<String, FcltUnitRawDto> unitMap, ChknQueueDay queueDay, int bgnMinute, String baseContext
	) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = normalizeUnitCd(unit.getUnitCd());

			if (unitCd.isEmpty()) {
				continue;
			}

			ChknQueueSlot slot = queueDay.slotOf(unitCd, bgnMinute, CARD_SLOT_MIN);
			int currentQueueCnt = slot.getCurrentQueue();

			result.add(new FcltUnitDto()
                .withUnitCd(unitCd)
                .withCgnStatus(queueDay.statusOf(
                    currentQueueCnt,
                    gradeContext(baseContext, unitCd)
                ))
                .withUseYn(slot.getOprBoothCnt() > 0 ? "Y" : "N")
            );
		}

		return result;
	}

	private DsbdFcltCardDto getChknFcltCard(String unitCd, ChknQueueDay queueDay, int bgnMinute, FcltUnitRawDto unit, List<FcltUnitDto> unitList, IslandMainAln islandMainAln, String baseContext) {
		String unitContext = unitContext(baseContext, FcltType.CHKN, unitCd);
		FcltQueueClearance clearance = queueDay.clearanceOf(unitCd, bgnMinute, CARD_SLOT_MIN);

		if (clearance == null) {
			throw new IllegalStateException("선택한 시설의 시뮬레이션 결과를 찾을 수 없습니다. " + unitContext);
		}

		ChknQueueSlot slot = queueDay.slotOf(unitCd, bgnMinute, CARD_SLOT_MIN);
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
		result.setCgnStatus(queueDay.statusOf(queuePsgCnt, gradeContext(baseContext, unitCd)));
		result.setRecommend(getRecommend(mainAlnNm, reqCnt, needAssign));
		result.setUnitList(unitList);

		return result;
	}

	private List<FcltUnitDto> getDepUnitList(
        Map<String, FcltUnitRawDto> unitMap,
        DepQueueWindow window,
        CgnGradeScale gradeScale,
        String baseContext
	) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = normalizeUnitCd(unit.getUnitCd());

			if (unitCd.isEmpty()) {
				continue;
			}

			result.add(
                new FcltUnitDto()
                    .withUnitCd(unitCd)
                    .withCgnStatus(
                        gradeScale.statusOf(
                            queueOf(window.sourceOf(unitCd)), gradeContext(baseContext, unitCd)
                        )
                    )
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
	private List<DsbdRsltDto> retrieveChknRsltByTime(String smltId, TerminalKind tmnlId, String excnYmd) {
		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper
            .retrieveFltPsgHourList(excnYmd, tmnlId.getFltTmnlIdList())
            .stream().collect(toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

        // Cast Queue
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltId, tmnlId, excnYmd);
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
		ChknQueueSlot cc = queueDay.tmnlSeries().slotOf(bgnMinute, MIN_PER_HOUR);
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
		if (fltSmry.getRsvtBrdgPsgCnt() == 0) {
			return 0;
		}

		return Math.toIntExact(fltSmry.getActlBrdgPsgCnt() * 100L / fltSmry.getRsvtBrdgPsgCnt());
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

	private String gradeContext(String baseContext, String unitCd) {
		return baseContext + ", unitCd=" + unitCd;
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
