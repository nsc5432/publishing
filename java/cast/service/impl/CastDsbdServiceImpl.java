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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import aoms.pm.cast.dto.PsgPrcsGradeRawDto;
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
import aoms.pm.cast.service.CastDsbdService;
import aoms.pm.cast.service.FcltRecommendationCalculator;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastDsbdServiceImpl implements CastDsbdService {
	private static final String YMD_FORMAT = "yyyyMMdd";
	private static final String DT_FORMAT = "yyyyMMddHHmmss";
	private static final String HOUR_SUFFIX = "00"; // 시간대별 결과는 정시 행이다
	private static final String EMPTY = "";
	private static final String USE_YN_Y = "Y";
	private static final String USE_YN_N = "N";
	private static final String AM = "AM";
	private static final String PM = "PM";

	private static final String DAY_END_HHMM = "2400"; // 자정을 넘는 구간을 잘라 붙이는 상한

	private static final int SEC_PER_MIN = 60; // _HR 컬럼(초) → 화면 표시 단위(분)
	private static final int MIN_PER_HOUR = 60;
	private static final int MIN_PER_DAY = 24 * MIN_PER_HOUR;
	private static final int HHMM_LENGTH = 4;
	private static final int NOON_HOUR = 12;
	private static final int PERCENT = 100;
	private static final int DAYS_A_WEEK = 7;
	private static final int DEFAULT_ITVL_MIN = 60; // 요약 블록의 구간 집계 기본 길이(분)
	private static final int FCLT_ROLLING_MIN = 60;
	private static final int CAST_SLOT_MIN = 10;
	private static final int CARD_CNT_LIMIT = 12; // 캐러셀이 감당하는 카드 수 상한
	private static final MathContext MATH_CONTEXT = MathContext.DECIMAL128;
	private static final String NORMAL_GRADE_CD = "02";
	private static final Map<String, String> FCLT_GROUP_CD_MAP = Map.of(
			"CK", "01",
			"CC", "02",
			"LGT", "03",
			"SC", "04",
			"SR", "04");
	private static final Set<String> CHKN_RECOMMEND_FCLT_CD_SET = Set.of("CC");
	private static final Set<String> SCRTY_RECOMMEND_FCLT_CD_SET = Set.of("SC", "SR");

	private final CastDsbdMapper castDsbdMapper;
	private final CastSmltService castSmltService;

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
		FltSmryRawDto fltSmry = castDsbdMapper.retrieveFltSmry(ymd, null);
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

		FltSmryRawDto baseFltSmry = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate), fltTmnlIdList);
		FltSmryRawDto befFltSmry = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate.minusDays(1)), fltTmnlIdList);
		FltSmryRawDto lastWeekFltSmry = castDsbdMapper.retrieveFltSmry(formatYmd(baseDate.minusDays(DAYS_A_WEEK)), fltTmnlIdList);

		result.setTmnlId(tmnlId.getValue());
		result.setFltCnt(baseFltSmry.getDepFltCnt());
		result.setPsgCnt(baseFltSmry.getDepPsgCnt());
		result.setFltDiffCnt(baseFltSmry.getDepFltCnt() - lastWeekFltSmry.getDepFltCnt());
		result.setPsgDiffCnt(baseFltSmry.getDepPsgCnt() - lastWeekFltSmry.getDepPsgCnt());
		result.setBefFltDiffCnt(baseFltSmry.getDepFltCnt() - befFltSmry.getDepFltCnt());
		result.setBefPsgDiffCnt(baseFltSmry.getDepPsgCnt() - befFltSmry.getDepPsgCnt());
		// 탑승률의 원천 컬럼이 확인되지 않았다 (D7)
		result.setBrdgRate(0);
		PeakDto peak = getPeak(searchDto.getSmltId(), tmnlId);
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(peak.getWtngPsgCnt()));
		result.setPeak(peak);

		setItvlSmry(result, searchDto, baseDate, fltTmnlIdList);

		return result;
	}

	@Override
	public List<DsbdRsltDto> retrieveDailySmltTmnlRsltByTime(DsbdSearchDto searchDto) {
		DsbdCategory category = searchDto.getCategory();
		TerminalKind tmnlId = searchDto.getTmnlId();

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		Map<String, SmltRsltRawDto> rsltMap = castDsbdMapper
				.retrieveRsltByHourList(searchDto.getSmltId(), tmnlId.getFcltTmnlId(), category.getUpPsgFcltCdList())
				.stream().collect(Collectors.toMap(SmltRsltRawDto::getTime, Function.identity(), (first, ignored) -> first));

		// 여객수 축은 결과 상세가 아니라 운항 원본에서 온다. 운항편 타일이면 편수를 그 자리에 쓴다
		Map<String, FltPsgRawDto> fltPsgMap = castDsbdMapper
				.retrieveHourlyFltPsgList(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList())
				.stream().collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

		// 실적선은 시뮬레이션이 아니라 실측(Xovis)이다. 아직 지나지 않은 시간대는 원천에 행이 없다
		Map<String, PsgWtngRawDto> psgWtngMap = castDsbdMapper
				.retrievePsgWtngByHourList(smltStng.getExcnYmd(), tmnlId.getFcltTmnlId(), category.getPsgWtngFcltTypeCdList())
				.stream().collect(Collectors.toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));
		String lastWeekYmd = formatYmd(parseYmd(smltStng.getExcnYmd()).minusDays(DAYS_A_WEEK));
		Map<String, PsgWtngRawDto> lastWeekPsgWtngMap = castDsbdMapper
				.retrievePsgWtngByHourList(lastWeekYmd, tmnlId.getFcltTmnlId(), category.getPsgWtngFcltTypeCdList())
				.stream().collect(Collectors.toMap(PsgWtngRawDto::getTime, Function.identity(), (first, ignored) -> first));

		List<DsbdRsltDto> result = new ArrayList<>();

		// 결과가 없는 시간대는 행이 통째로 없다. 24시간 축은 애플리케이션이 채운다
		for (String hour : TimeBucketUtils.hourList()) {
			result.add(toRsltDto(
					hour,
					rsltMap.get(hour + HOUR_SUFFIX),
					fltPsgMap.get(hour),
					psgWtngMap.get(hour + HOUR_SUFFIX),
					lastWeekPsgWtngMap.get(hour + HOUR_SUFFIX),
					category
			));
		}

		return result;
	}

	@Override
	public List<DsbdFcltCardDto> retrieveDailySmltFcltCard(DsbdSearchDto searchDto) {
		FcltType fcltType = searchDto.getFcltType();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		List<String> cardFcltCdList = getCardFcltCdList(fcltType);
		Set<String> recommendFcltCdSet = getRecommendFcltCdSet(fcltType);
		String fcltGroupCd = getFcltGroupCd(fcltType);
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());
		RollingRange range = getRollingRange(smltStng.getExcnYmd(), searchDto.getHhmm());
		List<SmltRsltRawDto> rawSlotList = castDsbdMapper.retrieveRsltByUnitList(
				searchDto.getSmltId(), fcltTmnlId, range.getBgnDt(), range.getEndDt(), cardFcltCdList);
		Map<String, List<SmltRsltRawDto>> displaySlotMap = mergeSlotsByUnit(rawSlotList, Set.copyOf(cardFcltCdList));
		Map<String, List<SmltRsltRawDto>> recommendSlotMap = mergeSlotsByUnit(rawSlotList, recommendFcltCdSet);
		Map<String, SmltRsltRawDto> displayRsltMap = aggregateByUnit(displaySlotMap);
		Map<String, SmltRsltRawDto> recommendRsltMap = aggregateByUnit(recommendSlotMap);

		if (range.hasEndSnapshot()) {
			List<SmltRsltRawDto> endSnapshotList = castDsbdMapper.retrieveRsltAtTimeList(
					searchDto.getSmltId(), fcltTmnlId, range.getEndDt(), new ArrayList<>(recommendFcltCdSet));
			appendSlots(recommendSlotMap, mergeSlotsByUnit(endSnapshotList, recommendFcltCdSet));
		}
		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, cardFcltCdList)
				.stream().collect(Collectors.toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));
		GradeScale gradeScale = getGradeScale(fcltGroupCd, searchDto);
		RecommendationResources resources = getRecommendationResources(fcltType, smltStng, fcltTmnlId, range.getBgnDt());
		List<FcltUnitDto> unitList = getUnitList(unitMap, recommendRsltMap, gradeScale, searchDto, fcltGroupCd);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		List<SmltRsltRawDto> ordered = displayRsltMap.values().stream()
				.sorted(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt).reversed())
				.limit(CARD_CNT_LIMIT)
				.collect(toList());

		for (SmltRsltRawDto rslt : ordered) {
			String unitCd = rslt.getUnitCd();
			SmltRsltRawDto recommendRslt = requireRecommendationRslt(
					recommendRsltMap.get(unitCd), searchDto, fcltType, fcltGroupCd, unitCd);
			List<SmltRsltRawDto> unitSlotList = recommendSlotMap.get(unitCd);
			BigDecimal forecastArrivals = getForecastArrivals(unitSlotList, range, searchDto, fcltType, unitCd);
			int currentOpenCount = resources.getOpenCountValue(unitCd);
			BigDecimal serviceRate = getServiceRate(
					searchDto,
					smltStng,
					fcltType,
					fcltTmnlId,
					unitCd,
					recommendFcltCdSet,
					range,
					recommendRslt.getTrnstPsgCnt(),
					currentOpenCount);
			FcltRecommendationCalculator.Result calculation = calculateRecommendation(
					recommendRslt,
					unitSlotList,
					forecastArrivals,
					serviceRate,
					gradeScale,
					range,
					searchDto,
					fcltType,
					unitCd);
			result.add(getFcltCard(
					fcltType,
					rslt,
					recommendRslt,
					unitMap.get(unitCd),
					unitList,
					resources.getTargetName(unitCd, searchDto, fcltType),
					calculation,
					gradeScale,
					range));
		}

		return result;
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

	private void setItvlSmry(TmnlSmryDto result, DsbdSearchDto searchDto, LocalDate baseDate, List<String> fltTmnlIdList) {
		int itvlMin = searchDto.getItvlMin() != null ? searchDto.getItvlMin() : DEFAULT_ITVL_MIN;
		String bgnHhmm = searchDto.getHhmm();

		result.setItvlMin(itvlMin);

		if (bgnHhmm == null || bgnHhmm.length() != HHMM_LENGTH) {
			return;
		}

		String endHhmm = getEndHhmm(bgnHhmm, itvlMin);
		FltSmryRawDto baseItvl = castDsbdMapper.retrieveFltSmryByTime(formatYmd(baseDate), fltTmnlIdList, bgnHhmm, endHhmm);
		FltSmryRawDto befItvl = castDsbdMapper.retrieveFltSmryByTime(formatYmd(baseDate.minusDays(1)), fltTmnlIdList, bgnHhmm, endHhmm);

		result.setItvlFltCnt(baseItvl.getDepFltCnt());
		result.setItvlPsgCnt(baseItvl.getDepPsgCnt());
		result.setItvlBefFltDiffCnt(baseItvl.getDepFltCnt() - befItvl.getDepFltCnt());
		result.setItvlBefPsgDiffCnt(baseItvl.getDepPsgCnt() - befItvl.getDepPsgCnt());
	}

	private PeakDto getPeak(String smltId, TerminalKind tmnlId) {
		List<SmltRsltRawDto> rsltList = castDsbdMapper.retrieveRsltByHourList(
				smltId, tmnlId.getFcltTmnlId(), DsbdCategory.PSG.getUpPsgFcltCdList());

		PeakDto result = new PeakDto();
		result.setAmpm(AM);
		result.setPeakTime(EMPTY);

		SmltRsltRawDto peak = rsltList.stream().max(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt)).orElse(null);

		if (peak == null) {
			return result;
		}

		int hour = Integer.parseInt(peak.getTime().substring(0, 2));

		result.setAmpm(hour < NOON_HOUR ? AM : PM);
		result.setPeakTime(peak.getTime());
		result.setWtngPsgCnt(peak.getWtngPsgCnt());
		result.setMaxWtngHr(peak.getWtngHr() / SEC_PER_MIN);
		result.setHrlyPrcsPsgCnt(peak.getTrnstPsgCnt());

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
		result.setTime(hour + HOUR_SUFFIX);

		if (fltPsg != null) {
			result.setPsgCnt(category == DsbdCategory.FLT ? fltPsg.getFltCnt() : fltPsg.getPsgCnt());
		}

		if (rslt != null) {
			result.setFcstWtngPsgCnt(rslt.getWtngPsgCnt());
			result.setWtngHr(rslt.getWtngHr() / SEC_PER_MIN);
			result.setPrcsPsgCnt(rslt.getTrnstPsgCnt());
			result.setPrcsHr(rslt.getPrcsHr() / SEC_PER_MIN);
			result.setPrcsRate(getPrcsRate(rslt.getTrnstPsgCnt(), rslt.getWtngPsgCnt()));
		}

		// 측정값이 없는 시간대는 0 이 아니라 null 이다 — 실적선을 끊어 그린다
		result.setWtngPsgCnt(psgWtng == null ? null : psgWtng.getWtngPsgCnt());

		result.setLastWeekWtngPsgCnt(lastWeekPsgWtng == null ? 0 : lastWeekPsgWtng.getWtngPsgCnt());

		return result;
	}

	private int getPrcsRate(int prcsPsgCnt, int wtngPsgCnt) {
		int total = prcsPsgCnt + wtngPsgCnt;

		return total == 0 ? 0 : prcsPsgCnt * PERCENT / total;
	}

	private List<String> getCardFcltCdList(FcltType fcltType) {
		if (fcltType == FcltType.DEP) {
			return List.of("LGT", "SC", "SR");
		}

		return List.of("CC", "CK", "SBD");
	}

	private Set<String> getRecommendFcltCdSet(FcltType fcltType) {
		return fcltType == FcltType.DEP ? SCRTY_RECOMMEND_FCLT_CD_SET : CHKN_RECOMMEND_FCLT_CD_SET;
	}

	private String getFcltGroupCd(FcltType fcltType) {
		String upPsgFcltCd = fcltType == FcltType.DEP ? "SC" : "CC";
		String fcltGroupCd = FCLT_GROUP_CD_MAP.get(upPsgFcltCd);

		if (fcltGroupCd == null) {
			throw new IllegalStateException("시설 그룹 매핑을 찾을 수 없습니다. upPsgFcltCd=" + upPsgFcltCd);
		}

		return fcltGroupCd;
	}

	private Map<String, List<SmltRsltRawDto>> mergeSlotsByUnit(
			List<SmltRsltRawDto> rawSlotList,
			Set<String> upPsgFcltCdSet
	) {
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

	private void appendSlots(
			Map<String, List<SmltRsltRawDto>> target,
			Map<String, List<SmltRsltRawDto>> additional
	) {
		additional.forEach((unitCd, slots) -> target.computeIfAbsent(unitCd, ignored -> new ArrayList<>()).addAll(slots));
		target.values().forEach(slots -> slots.sort(Comparator.comparing(SmltRsltRawDto::getSmltActlDt)));
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
			GradeScale gradeScale,
			DsbdSearchDto searchDto,
			String fcltGroupCd
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
					.withCgnStatus(gradeScale.statusOf(wtngPsgCnt, gradeContext(searchDto, fcltGroupCd, unitCd)))
					.withUseYn(unit.getOprCnt() > 0 ? USE_YN_Y : USE_YN_N));
		}

		return result;
	}

	private DsbdFcltCardDto getFcltCard(
			FcltType fcltType,
			SmltRsltRawDto displayRslt,
			SmltRsltRawDto recommendRslt,
			FcltUnitRawDto unit,
			List<FcltUnitDto> unitList,
			String targetName,
			FcltRecommendationCalculator.Result calculation,
			GradeScale gradeScale,
			RollingRange range
	) {
		boolean isChkn = fcltType != FcltType.DEP;
		String unitCd = displayRslt.getUnitCd();

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(fcltType.getValue() + "-" + unitCd);
		result.setFcltType(isChkn ? FcltType.CHKN : FcltType.DEP);
		result.setIsland(isChkn ? unitCd : EMPTY);
		result.setDptgtNo(isChkn ? EMPTY : unitCd);
		result.setFcltNm(isChkn ? unitCd : unitCd + "번");
		// 카드 부제(예: 좌측 B4~B8)를 만들 배치 정보가 없다 (D7)
		result.setFcltDesc(EMPTY);
		result.setTotCnt(unit != null ? unit.getTotCnt() : 0);
		result.setOprCnt(unit != null ? unit.getOprCnt() : 0);
		result.setWtngPsgCnt(displayRslt.getWtngPsgCnt());
		result.setHrlyPrcsPsgCnt(toPaxPerMin(displayRslt.getTrnstPsgCnt(), range.getActualMinutes()));
		result.setHrlyPrcsRate(getPrcsRate(displayRslt.getTrnstPsgCnt(), displayRslt.getWtngPsgCnt()));
		result.setCgnClearTime(range.getBgnDt().plusMinutes(calculation.getClearMinutes()).format(DateTimeFormatter.ofPattern("HHmm")));
		result.setCgnClearRate(0);
		result.setCgnStatus(gradeScale.statusOf(recommendRslt.getWtngPsgCnt(), "unitCd=" + unitCd));
		result.setRecommend(getRecommend(fcltType, targetName, calculation.getRequiredTotal()));
		result.setUnitList(unitList);

		return result;
	}

	private FcltRecommendDto getRecommend(FcltType fcltType, String targetName, int requiredTotal) {
		FcltRecommendDto result = new FcltRecommendDto();

		result.setTargetNm(targetName);
		result.setAddCnt(requiredTotal);
		result.setNeedAssignYn(fcltType == FcltType.DEP ? USE_YN_N : USE_YN_Y);

		return result;
	}

	private int toPaxPerMin(int processedPsgCnt, int actualMinutes) {
		return BigDecimal.valueOf(processedPsgCnt)
				.divide(BigDecimal.valueOf(actualMinutes), 0, RoundingMode.HALF_UP)
				.intValueExact();
	}

	private RollingRange getRollingRange(String excnYmd, String hhmm) {
		if (hhmm == null || !hhmm.matches("(?:[01][0-9]|2[0-3])[0-5][0-9]")) {
			throw new IllegalArgumentException("조회 시각 형식이 올바르지 않습니다. hhmm=" + hhmm);
		}

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

		return new RollingRange(dayStart, dayEnd, bgnDt, endDt, actualMinutes);
	}

	private GradeScale getGradeScale(String fcltGroupCd, DsbdSearchDto searchDto) {
		return new GradeScale(
				fcltGroupCd,
				castDsbdMapper.retrievePsgPrcsGradeList(fcltGroupCd),
				baseContext(searchDto) + ", fcltGroupCd=" + fcltGroupCd);
	}

	private RecommendationResources getRecommendationResources(
			FcltType fcltType,
			SmltStngDto smltStng,
			String fcltTmnlId,
			LocalDateTime bgnDt
	) {
		if (fcltType == FcltType.DEP) {
			String resourceId = smltStng.getFcltyOpngScrtyCntrlRsrcId();
			requireResourceId(resourceId, "FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID", smltStng);
			Map<String, Integer> openCountMap = new LinkedHashMap<>();
			for (FcltUnitRawDto raw : castDsbdMapper.retrieveScrtyOpenCountList(fcltTmnlId, resourceId)) {
				String unitCd = normalizeUnitCd(raw.getUnitCd());
				if (raw.getTotCnt() != 1) {
					throw new IllegalStateException(
							"보안검색대 운영 snapshot에서 조회 시각의 행을 식별할 수 없습니다. "
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
		List<ChknAlnAssignmentRawDto> assignmentList = castDsbdMapper.retrieveChknAlnAssignmentList(
				smltStng.getExcnYmd(), fcltTmnlId, bgnDt, resourceId);
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

	private void requireResourceId(String resourceId, String columnName, SmltStngDto smltStng) {
		if (resourceId == null || resourceId.trim().isEmpty()) {
			throw new IllegalStateException(
					"실행 리소스 정보를 찾을 수 없습니다. smltId=" + smltStng.getSmltId() + ", column=" + columnName);
		}
	}

	private SmltRsltRawDto requireRecommendationRslt(
			SmltRsltRawDto rslt,
			DsbdSearchDto searchDto,
			FcltType fcltType,
			String fcltGroupCd,
			String unitCd
	) {
		if (rslt == null) {
			throw new IllegalStateException(
					"추천 시설 결과를 찾을 수 없습니다. "
							+ baseContext(searchDto)
							+ ", fcltType=" + fcltType.getValue()
							+ ", fcltGroupCd=" + fcltGroupCd
							+ ", unitCd=" + unitCd);
		}

		return rslt;
	}

	private BigDecimal getForecastArrivals(
			List<SmltRsltRawDto> slotList,
			RollingRange range,
			DsbdSearchDto searchDto,
			FcltType fcltType,
			String unitCd
	) {
		String context = baseContext(searchDto) + ", fcltType=" + fcltType.getValue() + ", unitCd=" + unitCd;

		if (slotList == null || slotList.isEmpty() || !range.getBgnDt().equals(slotList.get(0).getSmltActlDt())) {
			throw new IllegalStateException("유입량 산정용 시작 스냅샷을 찾을 수 없습니다. " + context);
		}

		SmltRsltRawDto last = slotList.get(slotList.size() - 1);
		if (!range.getEndDt().equals(last.getSmltActlDt())) {
			throw new IllegalStateException(
					"유입량 산정용 종료 스냅샷을 찾을 수 없습니다. "
							+ context
							+ ", endDt=" + range.getEndDt());
		}

		BigDecimal result = BigDecimal.ZERO;
		for (int index = 0; index < slotList.size() - 1; index++) {
			SmltRsltRawDto current = slotList.get(index);
			SmltRsltRawDto next = slotList.get(index + 1);
			long intervalMinutes = Duration.between(current.getSmltActlDt(), next.getSmltActlDt()).toMinutes();

			if (intervalMinutes != CAST_SLOT_MIN) {
				throw new IllegalStateException(
						"CAST 결과 슬롯 간격이 올바르지 않습니다. "
								+ context
								+ ", currentDt=" + current.getSmltActlDt()
								+ ", nextDt=" + next.getSmltActlDt());
			}

			int arrival = Math.max(0, next.getWtngPsgCnt() - current.getWtngPsgCnt() + current.getTrnstPsgCnt());
			result = result.add(BigDecimal.valueOf(arrival));
		}

		return result;
	}

	private BigDecimal getServiceRate(
			DsbdSearchDto searchDto,
			SmltStngDto smltStng,
			FcltType fcltType,
			String fcltTmnlId,
			String unitCd,
			Set<String> recommendFcltCdSet,
			RollingRange range,
			int processedPsgCnt,
			int currentOpenCount
	) {
		if (currentOpenCount > 0 && processedPsgCnt > 0) {
			return calculateServiceRate(processedPsgCnt, currentOpenCount, range.getActualMinutes());
		}

		List<SmltRsltRawDto> priorRawList = castDsbdMapper.retrieveRsltByUnitList(
				searchDto.getSmltId(),
				fcltTmnlId,
				range.getDayStart(),
				range.getBgnDt(),
				new ArrayList<>(recommendFcltCdSet));
		List<SmltRsltRawDto> priorSlotList = mergeSlotsByUnit(priorRawList, recommendFcltCdSet)
				.getOrDefault(unitCd, List.of());

		for (int index = priorSlotList.size() - 1; index >= 0; index--) {
			SmltRsltRawDto slot = priorSlotList.get(index);
			if (slot.getTrnstPsgCnt() <= 0) {
				continue;
			}

			RecommendationResources resources = getRecommendationResources(
					fcltType, smltStng, fcltTmnlId, slot.getSmltActlDt());
			int priorOpenCount = resources.getOpenCountValue(unitCd);
			if (priorOpenCount > 0) {
				return calculateServiceRate(slot.getTrnstPsgCnt(), priorOpenCount, CAST_SLOT_MIN);
			}
		}

		throw new IllegalStateException(
				"시설당 처리능력을 산정할 수 없습니다. "
						+ baseContext(searchDto)
						+ ", fcltType=" + fcltType.getValue()
						+ ", unitCd=" + unitCd
						+ ", currentOpenCount=" + currentOpenCount
						+ ", processedPsgCnt=" + processedPsgCnt);
	}

	private BigDecimal calculateServiceRate(int processedPsgCnt, int openCount, int minutes) {
		return BigDecimal.valueOf(processedPsgCnt)
				.divide(BigDecimal.valueOf(openCount), MATH_CONTEXT)
				.divide(BigDecimal.valueOf(minutes), MATH_CONTEXT);
	}

	private FcltRecommendationCalculator.Result calculateRecommendation(
			SmltRsltRawDto recommendRslt,
			List<SmltRsltRawDto> slotList,
			BigDecimal forecastArrivals,
			BigDecimal serviceRate,
			GradeScale gradeScale,
			RollingRange range,
			DsbdSearchDto searchDto,
			FcltType fcltType,
			String unitCd
	) {
		int initialQueue = slotList.get(0).getWtngPsgCnt();
		try {
			return FcltRecommendationCalculator.calculate(
					BigDecimal.valueOf(initialQueue),
					forecastArrivals,
					BigDecimal.valueOf(range.getActualMinutes()),
					serviceRate,
					gradeScale.getNormalMax());
		} catch (IllegalArgumentException | IllegalStateException exception) {
			throw new IllegalStateException(
					"시설 추천 계산에 실패했습니다. "
							+ baseContext(searchDto)
							+ ", fcltType=" + fcltType.getValue()
							+ ", unitCd=" + unitCd
							+ ", initialQueue=" + initialQueue
							+ ", peakQueue=" + recommendRslt.getWtngPsgCnt()
							+ ", forecastArrivals=" + forecastArrivals
							+ ", serviceRate=" + serviceRate
							+ ", targetQueue=" + gradeScale.getNormalMax(),
					exception);
		}
	}

	private String normalizeUnitCd(String unitCd) {
		return unitCd != null ? unitCd.trim() : EMPTY;
	}

	private String baseContext(DsbdSearchDto searchDto) {
		return "smltId=" + searchDto.getSmltId()
				+ ", tmnlId=" + (searchDto.getTmnlId() != null ? searchDto.getTmnlId().getValue() : null)
				+ ", hhmm=" + searchDto.getHhmm();
	}

	private String gradeContext(DsbdSearchDto searchDto, String fcltGroupCd, String unitCd) {
		return baseContext(searchDto) + ", fcltGroupCd=" + fcltGroupCd + ", unitCd=" + unitCd;
	}

	private static final class RollingRange {
		private final LocalDateTime dayStart;
		private final LocalDateTime dayEnd;
		private final LocalDateTime bgnDt;
		private final LocalDateTime endDt;
		private final int actualMinutes;

		private RollingRange(
				LocalDateTime dayStart,
				LocalDateTime dayEnd,
				LocalDateTime bgnDt,
				LocalDateTime endDt,
				int actualMinutes
		) {
			this.dayStart = dayStart;
			this.dayEnd = dayEnd;
			this.bgnDt = bgnDt;
			this.endDt = endDt;
			this.actualMinutes = actualMinutes;
		}

		private LocalDateTime getDayStart() {
			return dayStart;
		}

		private LocalDateTime getBgnDt() {
			return bgnDt;
		}

		private LocalDateTime getEndDt() {
			return endDt;
		}

		private int getActualMinutes() {
			return actualMinutes;
		}

		private boolean hasEndSnapshot() {
			return endDt.isBefore(dayEnd);
		}
	}

	private static final class AssignmentSummary {
		private final String alnCd;
		private final String alnNm;
		private final int assignedCount;

		private AssignmentSummary(String alnCd, String alnNm, int assignedCount) {
			this.alnCd = alnCd;
			this.alnNm = alnNm;
			this.assignedCount = assignedCount;
		}

		private String getAlnCd() {
			return alnCd;
		}

		private String getAlnNm() {
			return alnNm;
		}

		private int getAssignedCount() {
			return assignedCount;
		}
	}

	private final class RecommendationResources {
		private final Map<String, Integer> openCountMap;
		private final Map<String, AssignmentSummary> targetMap;
		private final String fixedTargetName;

		private RecommendationResources(
				Map<String, Integer> openCountMap,
				Map<String, AssignmentSummary> targetMap,
				String fixedTargetName
		) {
			this.openCountMap = openCountMap;
			this.targetMap = targetMap;
			this.fixedTargetName = fixedTargetName;
		}

		private int getOpenCountValue(String unitCd) {
			return openCountMap.getOrDefault(unitCd, 0);
		}

		private String getTargetName(String unitCd, DsbdSearchDto searchDto, FcltType fcltType) {
			if (fixedTargetName != null) {
				return fixedTargetName;
			}

			AssignmentSummary target = targetMap.get(unitCd);
			if (target == null || target.getAlnCd().isEmpty()) {
				throw new IllegalStateException(
						"체크인 항공사 배정정보를 찾을 수 없습니다. "
								+ baseContext(searchDto)
								+ ", fcltType=" + fcltType.getValue()
								+ ", unitCd=" + unitCd);
			}

			if (target.getAlnNm().isEmpty()) {
				throw new IllegalStateException(
						"체크인 항공사명을 찾을 수 없습니다. "
								+ baseContext(searchDto)
								+ ", fcltType=" + fcltType.getValue()
								+ ", unitCd=" + unitCd
								+ ", alnCd=" + target.getAlnCd());
			}

			return target.getAlnNm();
		}
	}

	private static final class GradeScale {
		private final List<PsgPrcsGradeRawDto> gradeList;
		private final BigDecimal normalMax;

		private GradeScale(String fcltGroupCd, List<PsgPrcsGradeRawDto> rawList, String context) {
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
					throw new IllegalStateException(
							"혼잡등급 기준정보가 중복되었습니다. " + context + ", psgPrcsGrdCd=" + gradeCode);
				}
				try {
					CongestionStatus.ofGradeCode(gradeCode);
				} catch (RuntimeException exception) {
					throw new IllegalStateException(
							"혼잡등급 코드가 올바르지 않습니다. " + context + ", psgPrcsGrdCd=" + gradeCode,
							exception);
				}
				validateRange(grade, context);
			}

			PsgPrcsGradeRawDto normal = gradeMap.get(NORMAL_GRADE_CD);
			if (normal == null) {
				throw new IllegalStateException(
						"NORMAL 혼잡등급 기준정보를 찾을 수 없습니다. "
								+ context
								+ ", psgPrcsGrdCd=" + NORMAL_GRADE_CD);
			}

			this.gradeList = new ArrayList<>(rawList);
			this.gradeList.sort(Comparator.comparing(PsgPrcsGradeRawDto::getMinVl));
			for (int index = 1; index < gradeList.size(); index++) {
				PsgPrcsGradeRawDto previous = gradeList.get(index - 1);
				PsgPrcsGradeRawDto current = gradeList.get(index);
				if (current.getMinVl().compareTo(previous.getMaxVl()) <= 0) {
					throw new IllegalStateException(
							"혼잡등급 기준 구간이 겹칩니다. "
									+ context
									+ ", previousGrade=" + previous.getPsgPrcsGrdCd()
									+ ", currentGrade=" + current.getPsgPrcsGrdCd());
				}
			}
			this.normalMax = normal.getMaxVl();
		}

		private static void validateRange(PsgPrcsGradeRawDto grade, String context) {
			if (grade.getMinVl() == null
					|| grade.getMaxVl() == null
					|| grade.getMinVl().signum() < 0
					|| grade.getMaxVl().signum() < 0
					|| grade.getMinVl().compareTo(grade.getMaxVl()) > 0) {
				throw new IllegalStateException(
						"혼잡등급 기준 구간이 올바르지 않습니다. "
								+ context
								+ ", psgPrcsGrdCd=" + grade.getPsgPrcsGrdCd()
								+ ", minVl=" + grade.getMinVl()
								+ ", maxVl=" + grade.getMaxVl());
			}
		}

		private CongestionStatus statusOf(int waitingCount, String context) {
			BigDecimal value = BigDecimal.valueOf(waitingCount);
			for (PsgPrcsGradeRawDto grade : gradeList) {
				if (value.compareTo(grade.getMinVl()) >= 0 && value.compareTo(grade.getMaxVl()) <= 0) {
					return CongestionStatus.ofGradeCode(grade.getPsgPrcsGrdCd());
				}
			}

			throw new IllegalStateException(
					"대기인원에 해당하는 혼잡등급 기준정보를 찾을 수 없습니다. "
							+ context
							+ ", waitingCount=" + waitingCount);
		}

		private BigDecimal getNormalMax() {
			return normalMax;
		}
	}

	// 재계산 주기가 확인되지 않아 다음 정시를 예정 시각으로 본다
	private String getNextCalcDt(String lastCalcDt) {
		if (lastCalcDt == null || lastCalcDt.length() != DT_FORMAT.length()) {
			return EMPTY;
		}

		LocalDateTime lastCalc = LocalDateTime.parse(lastCalcDt, DateTimeFormatter.ofPattern(DT_FORMAT));

		return lastCalc.plusHours(1).withMinute(0).withSecond(0).format(DateTimeFormatter.ofPattern(DT_FORMAT));
	}

	// 예측시분(PREDC_HM)에 날짜가 없어 자정을 넘는 구간은 그날 끝까지로 자른다
	private String getEndHhmm(String bgnHhmm, int itvlMin) {
		int endMin = Integer.parseInt(bgnHhmm.substring(0, 2)) * MIN_PER_HOUR
				+ Integer.parseInt(bgnHhmm.substring(2, HHMM_LENGTH)) + itvlMin;

		return endMin >= MIN_PER_DAY
				? DAY_END_HHMM
				: String.format("%02d%02d", endMin / MIN_PER_HOUR, endMin % MIN_PER_HOUR);
	}

	private LocalDate parseYmd(String ymd) {
		return LocalDate.parse(ymd, DateTimeFormatter.ofPattern(YMD_FORMAT));
	}

	private String formatYmd(LocalDate date) {
		return date.format(DateTimeFormatter.ofPattern(YMD_FORMAT));
	}
}
