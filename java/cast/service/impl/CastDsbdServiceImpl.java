package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toMap;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.CgnOrder;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.dsbd.AssignmentSummary;
import aoms.pm.cast.domains.dsbd.IslandMainAln;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.wtng.FcltQueueClearance;
import aoms.pm.cast.domains.wtng.FcltQueueSource;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngIntrvl;
import aoms.pm.cast.domains.wtng.FcltWtngSecs;
import aoms.pm.cast.domains.wtng.FcltWtngSlot;
import aoms.pm.cast.dto.BdpsgAnceRawDto;
import aoms.pm.cast.dto.ChknAlnAssignmentRawDto;
import aoms.pm.cast.dto.DowAttrDto;
import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdFltIntrvlDto;
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
	private static final int DEFAULT_INTRVL_MIN = 60;	private static final String DEP_TARGET_NM = "보안검색대";
	private static final List<String> DEP_UNIT_FCLT_CD_LIST = List.of("LGT");
	private static final List<String> SC_MAX_FCLT_CD_LIST = List.of("SC");
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
		result.setPeak(getPeak(retrieveRsltHourSnapshotList(smltStng, tmnlId, DsbdCategory.PSG)));

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
			if (intrvlMin % FcltWtngSecs.SEC_MIN != 0) {
				result.error("구간 집계 길이는 " + FcltWtngSecs.SEC_MIN + "분 단위여야 합니다. intrvlMin=" + intrvlMin);
				return result;
			}

			SmltStngDto wtngStng = castSmltService.retrieveUniqueSmltStng(smltStng.getSmltId());
			FcltWtngDay chknDay = castFcltWtngService.retrieveFcltWtngDay(wtngStng, tmnlId, FcltType.CHKN);
			FcltWtngDay depDay = castFcltWtngService.retrieveFcltWtngDay(wtngStng, tmnlId, FcltType.DEP);
			LocalDateTime evalDt = chknDay.dtOf(toMinutes(bgnHhmm));
			LocalDateTime smryEndDt = chknDay.dtOf(Math.min(toMinutes(bgnHhmm) + intrvlMin, MIN_PER_DAY));

			// 대표 혼잡등급은 PRIME TIME(대기인원 피크)과 별개로 조회 시각의 시설별 평균 대기시간에서 정한다
			applyTmnlCgn(result, chknDay, depDay, evalDt);
			applySmryInfo(result, searchDto.getCategory(), chknDay.intrvlOf(evalDt, smryEndDt), depDay.intrvlOf(evalDt, smryEndDt));

			if (searchDto.getCategory() != DsbdCategory.CHKN && searchDto.getCategory() != DsbdCategory.DEP) {
				// 랜드사이드 대기인원은 피크시간과 같은 CAST 원값이다. 체크인 몫을 공용 Queue 로 재구성하면 피크와 어긋난다
				result.setSmryWtngPsgCnt(retrieveRsltWtngPsgCnt(wtngStng, tmnlId, evalDt));
			}

			List<DsbdFltIntrvlDto> intrvlList = retrieveFltIntrvlList(baseDate, fltTmnlIdList, bgnHhmm, intrvlMin);
			DsbdFltIntrvlDto currentIntrvl = intrvlList.get(0);

			result.setIntrvlList(intrvlList);
			result.setIntrvlFltCnt(currentIntrvl.getFltCnt());
			result.setIntrvlPsgCnt(currentIntrvl.getPsgCnt());
			result.setIntrvlYesterdayFltDiffCnt(currentIntrvl.getYesterdayFltDiffCnt());
			result.setIntrvlYesterdayPsgDiffCnt(currentIntrvl.getYesterdayPsgDiffCnt());
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

	private void applyTmnlCgn(TmnlSmryDto result, FcltWtngDay chknDay, FcltWtngDay depDay, LocalDateTime evalDt) {
		for (String island : chknDay.unitCdList()) {
			applyWorseCgn(result, chknDay, island, evalDt);
		}

		for (String unitCd : depDay.presentUnitCdList(evalDt)) {
			applyWorseCgn(result, depDay, unitCd, evalDt);
		}
	}

	// 랜드사이드는 여객 한 명이 체크인과 출국장을 모두 지나므로 유입은 진입(아일랜드), 처리는 진출(출국장)로 센다
	private void applySmryInfo(TmnlSmryDto result, DsbdCategory category, FcltWtngIntrvl chkn, FcltWtngIntrvl dep) {
		FcltWtngIntrvl intrvl;
		if (category == DsbdCategory.CHKN) {
			intrvl = chkn;
		} else if (category == DsbdCategory.DEP) {
			intrvl = dep;
		} else {
			intrvl = FcltWtngIntrvl.landsideOf(chkn, dep);
		}

		result.setSmryWtngPsgCnt(intrvl.getWtngPsgCnt());
		result.setSmryAvgWtngSec(intrvl.getAvgWtngSec());
		result.setSmryIntvArvlPsgCnt(intrvl.getIntvArvlPsgCnt());
		result.setSmryIntvPrcsPsgCnt(intrvl.getIntvPrcsPsgCnt());
		result.setSmryArvlPsgCnt(intrvl.getArvlPsgCnt());
		result.setSmryPrcsPsgCnt(intrvl.getPrcsPsgCnt());
	}

	private Integer retrieveRsltWtngPsgCnt(SmltStngDto smltStng, TerminalKind tmnlId, LocalDateTime smltActlDt) {
		List<SmltRsltRawDto> rsltList = castDsbdMapper.retrieveRsltByUnitList(smltStng.getSmltId(), tmnlId.getFcltTmnlId(),
				null, null, smltActlDt, DsbdCategory.PSG.getUpPsgFcltCdList(), smltStng.getSmltMdlSn());

		if (rsltList.isEmpty()) {
			return null;
		}

		return rsltList.stream().mapToInt(SmltRsltRawDto::getWtngPsgCnt).sum();
	}

	// 체크인 / 출국장 기준표가 달라 대기시간이 아니라 등급으로 비교한다
	private void applyWorseCgn(TmnlSmryDto result, FcltWtngDay wtngDay, String unitCd, LocalDateTime evalDt) {
		CongestionStatus status = wtngDay.gradeOf(unitCd, evalDt).getValue();

		if (status == null) {
			return;
		}

		CongestionStatus worstStatus = result.getCgnStatus();

		if (worstStatus == null || status.compareTo(worstStatus) > 0) {
			result.setCgnStatus(status);
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
			return retrieveDepRsltByTime(smltStng, tmnlId);
		}

		Map<String, SmltRsltRawDto> rsltByHour = retrieveRsltHourSnapshotList(smltStng, tmnlId, category).stream()
				.collect(toMap(SmltRsltRawDto::getTime, Function.identity(), (first, ignored) -> first));

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
		Map<String, Integer> arvlByHour = retrieveArvlByHour(smltStng, tmnlId, category);

		for (String hour : TimeBucketUtils.hourList()) {
			DsbdRsltDto row = toRsltDto(
					hour,
					rsltByHour.get(hour + "00"),
					fltPsgByHour.get(hour),
					psgWtngByHour.get(hour + "00"),
					lastWeekPsgWtngByHour.get(hour + "00"),
					category
			);
			row.setArvlPsgCnt(arvlByHour.get(hour + "00"));
			result.add(row);
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
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(smltId);
		// 출국장 대기 / 등급은 LGT, 보안검색대 수 추천 / 해소는 SC / SR 큐에서 정한다
		FcltWtngDay depDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.DEP);
		FcltWtngDay scDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.SC);
		LocalDateTime evalDt = depDay.dtOf(toMinutes(searchDto.getHhmm()));
		int prcsMin = prcsWindowMin(searchDto.getHhmm());

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, DEP_UNIT_FCLT_CD_LIST)
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));
		Map<String, FcltUnitRawDto> scUnitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, SC_MAX_FCLT_CD_LIST)
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getDepUnitList(unitMap, depDay, evalDt);
		Set<String> unitCdSet = new TreeSet<>(depDay.presentUnitCdList(evalDt));
		unitCdSet.addAll(scDay.presentUnitCdList(evalDt));

		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (String unitCd : unitCdSet) {
			result.add(getDepFcltCard(unitCd, depDay, evalDt, prcsMin, scDay.clearanceOf(unitCd, evalDt), scUnitMap.get(unitCd), unitList));
		}

		result.sort(CgnOrder.byWaitDesc(DsbdFcltCardDto::getCgnWtngSec, DsbdFcltCardDto::getWtngPsgCnt, DsbdFcltCardDto::getDptgtNo));

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
		int prcsMin = prcsWindowMin(hhmm);
		IslandMainAln islandMainAln = retrieveIslandMainAln(smltStng, fcltTmnlId, evalDt);

		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, List.of("CC"))
				.stream().collect(toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getChknUnitList(unitMap, wtngDay, evalDt);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		for (String unitCd : sortedByWait(wtngDay, evalDt)) {
			result.add(getChknFcltCard(unitCd, wtngDay, evalDt, prcsMin, unitMap.get(unitCd), unitList, islandMainAln, baseContext));
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

	private DsbdFcltCardDto getChknFcltCard(String unitCd, FcltWtngDay wtngDay, LocalDateTime evalDt, int prcsMin, FcltUnitRawDto unit, List<FcltUnitDto> unitList, IslandMainAln islandMainAln, String baseContext) {
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
		result.setHrlyArvlPsgCnt(wtngDay.arvlPsgCntOf(unitCd, evalDt, prcsMin));
		result.setHrlyPrcsPsgCnt(wtngDay.slotOf(unitCd, evalDt, prcsMin).getPrcsPsgCnt());
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

	// 보유 / 운영 수량은 혼잡해소 팝업과 같은 보안검색대 수 — 보유는 시설 마스터 SC, 운영은 실행 리소스 운영표
	private DsbdFcltCardDto getDepFcltCard(
			String unitCd,
			FcltWtngDay depDay,
			LocalDateTime evalDt,
			int prcsMin,
			FcltQueueClearance scClearance,
			FcltUnitRawDto scUnit,
			List<FcltUnitDto> unitList
	) {
		FcltQueueClearance.Recommend recommend = scClearance.recommendOf(FcltQueueClearance.DFLT_TARGET_MIN);
		Integer oprCnt = scClearance.getSource().getOprCnt();
		Computed<Double> avgWtngSec = depDay.avgWtngSecOf(unitCd, evalDt);

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(FcltType.DEP.getValue() + "-" + unitCd);
		result.setFcltType(FcltType.DEP);
		result.setIsland(EMPTY);
		result.setDptgtNo(unitCd);
		result.setFcltNm(unitCd + "번");
		result.setTotCnt(scUnit != null ? scUnit.getTotCnt() : 0);
		result.setOprCnt(oprCnt != null ? oprCnt : 0);
		result.setWtngPsgCnt(queueOf(depDay.sourceOf(unitCd, evalDt)));
		result.setHrlyArvlPsgCnt(depDay.arvlPsgCntOf(unitCd, evalDt, prcsMin));
		result.setHrlyPrcsPsgCnt(depDay.slotOf(unitCd, evalDt, prcsMin).getPrcsPsgCnt());
		applyClearance(result, scClearance, recommend);
		result.setCgnWtngSec(avgWtngSec.getValue());
		result.setCgnStatus(depDay.getGradeScale().gradeOf(avgWtngSec).getValue());
		result.setRecommend(getRecommend(recommend.getReqCnt() == null ? EMPTY : DEP_TARGET_NM, recommend.getReqCnt(), false));
		result.setUnitList(unitList);

		return result;
	}

	/*
	 * 해소값은 보유 수량을 넘어도 추천 수량을 가정
	 */
	private void applyClearance(DsbdFcltCardDto card, FcltQueueClearance clearance, FcltQueueClearance.Recommend recommend) {
		Computed<Double> loadRatio = clearance.getLoadRatio();
		FcltQueueClearance.ClearanceResult clear = recommend.getReqClear();
		Integer clearMin = clear == null ? null : clear.getClearMin();
		Integer oprCnt = clearance.getSource().getOprCnt();
		// 혼잡해소 팝업 COUNT 모드에 현재 운영 수량을 넣은 결과와 같다
		FcltQueueClearance.ClearanceResult oprClear = oprCnt == null ? null : clearance.clearOf(oprCnt, FcltQueueClearance.DFLT_TARGET_MIN);
		Integer oprClearMin = oprClear == null ? null : oprClear.getClearMin();

		card.setCgnWtngSec(clearance.getObservedWait().getValue());
		card.setHrlyPrcsRate(loadRatio.hasValue() ? toRoundedInt(loadRatio.getValue() * 100) : 0);
		card.setCgnClearTime(clearMin == null ? EMPTY : toHhmm(clear.getClearDt()));
		card.setCgnClearRate(clearMin == null ? 0 : toClearRate(clearMin));
		card.setOprCgnClearTime(oprClearMin == null ? EMPTY : toHhmm(oprClear.getClearDt()));
		card.setOprCgnClearMin(oprClearMin);
	}

	private String toHhmm(LocalDateTime dt) {
		return dt.format(DateTimeFormatter.ofPattern("HHmm"));
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

	// 요약정보 시간당 처리인원과 같은 [hhmm, hhmm+60) 구간 — 24시에서 자른다
	private int prcsWindowMin(String hhmm) {
		return Math.min(DEFAULT_INTRVL_MIN, MIN_PER_DAY - toMinutes(hhmm));
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

	private List<SmltRsltRawDto> retrieveRsltHourSnapshotList(SmltStngDto smltStng, TerminalKind tmnlId, DsbdCategory category) {
		LocalDateTime dayStart = parseYmd(smltStng.getExcnYmd()).atStartOfDay();
		return castDsbdMapper.retrieveRsltHourSnapshotList(smltStng.getSmltId(), tmnlId.getFcltTmnlId(),
				dayStart, dayStart.plusDays(1), category.getUpPsgFcltCdList(), smltStng.getSmltMdlSn());
	}

	private Map<String, Integer> retrieveArvlByHour(SmltStngDto smltStng, TerminalKind tmnlId, DsbdCategory category) {
		LocalDateTime dayStart = parseYmd(smltStng.getExcnYmd()).atStartOfDay();
		List<SmltRsltRawDto> rsltList = castDsbdMapper.retrieveRsltByUnitList(
				smltStng.getSmltId(), tmnlId.getFcltTmnlId(), dayStart.minusMinutes(FcltWtngSecs.SEC_MIN),
				dayStart.plusDays(1), null, category.getUpPsgFcltCdList(), smltStng.getSmltMdlSn());
		Map<String, Map<LocalDateTime, SmltRsltRawDto>> rsltByUnit = new LinkedHashMap<>();

		for (SmltRsltRawDto rslt : rsltList) {
			if (rslt.getSmltActlDt() != null) {
				String unitKey = rslt.getUpPsgFcltCd() + ":" + rslt.getUnitCd();
				rsltByUnit.computeIfAbsent(unitKey, ignored -> new LinkedHashMap<>())
						.put(rslt.getSmltActlDt(), rslt);
			}
		}

		Map<String, Integer> result = new LinkedHashMap<>();

		for (Map<LocalDateTime, SmltRsltRawDto> unitRslt : rsltByUnit.values()) {
			for (SmltRsltRawDto rslt : unitRslt.values()) {
				LocalDateTime resultDt = rslt.getSmltActlDt();
				if (resultDt.isBefore(dayStart)
						|| (category != DsbdCategory.DEP && resultDt.getMinute() != 0)) {
					continue;
				}

				SmltRsltRawDto prev = unitRslt.get(resultDt.minusMinutes(FcltWtngSecs.SEC_MIN));
				if (prev != null) {
					int arrival = Math.toIntExact(Math.max(0L,
							(long) rslt.getWtngPsgCnt() - prev.getWtngPsgCnt() + rslt.getTrnstPsgCnt()));
					result.merge(toHhmm(resultDt.getHour() * MIN_PER_HOUR), arrival, Math::addExact);
				}
			}
		}

		return result;
	}

	private PeakDto getPeak(List<SmltRsltRawDto> snapshotList) {
		SmltRsltRawDto peak = snapshotList.stream().max(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt)).orElse(null);

		PeakDto result = new PeakDto();
		result.setAmpm("AM");
		result.setPeakTime(EMPTY);

		if (peak == null) {
			return result;
		}

		int hour = Integer.parseInt(peak.getTime().substring(0, 2));

		result.setAmpm(hour < 12 ? "AM" : "PM");
		result.setPeakTime(peak.getTime());
		result.setWtngPsgCnt(peak.getWtngPsgCnt());
		result.setAvgWtngHr((int) Math.round(peak.getAvgWtngSec() / SEC_PER_MIN));
		result.setPrcsPsgCnt(peak.getTrnstPsgCnt());

		return result;
	}

    // PRIME TIME 체크인카운터
	private List<DsbdRsltDto> retrieveChknRsltByTime(SmltStngDto smltStng, TerminalKind tmnlId) {
		String excnYmd = smltStng.getExcnYmd();
		Map<String, FltPsgRawDto> fltPsgByHour = castFltPsgMapper
            .retrieveFltPsgHourList(excnYmd, tmnlId.getFltTmnlIdList())
            .stream().collect(toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));

        // Cast Queue
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltStng, tmnlId);

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
        FltPsgRawDto fltPsg,
        PsgWtngRawDto psgWtng,
        PsgWtngRawDto lastWeekPsgWtng
	) {
		int bgnMinute = Integer.parseInt(hour) * MIN_PER_HOUR;
		int endMinute = bgnMinute + MIN_PER_HOUR;
		FcltWtngSlot cc = queueDay.tmnlSeries().slotOf(bgnMinute, MIN_PER_HOUR);
		int maxIslandQueue = 0;

		for (String island : queueDay.islandCdList()) {
			for (int minute = bgnMinute; minute < endMinute; minute++) {
				maxIslandQueue = Math.max(maxIslandQueue, queueDay.queueAt(island, minute));
			}
		}

		int prcsPsgCnt = cc.getPrcsPsgCnt();
		int arvlPsgCnt = 0;

		for (int minute = bgnMinute; minute < endMinute; minute++) {
			arvlPsgCnt = Math.addExact(arvlPsgCnt, queueDay.tmnlSeries().arrivalAt(minute));
		}

		DsbdRsltDto result = new DsbdRsltDto();
		result.setTime(hour + "00");
		result.setPsgCnt(fltPsg == null ? 0 : fltPsg.getPsgCnt());
		result.setFltCnt(fltPsg == null ? 0 : fltPsg.getFltCnt());
		result.setFcstWtngPsgCnt(maxIslandQueue);
		result.setArvlPsgCnt(arvlPsgCnt);
		result.setPrcsPsgCnt(prcsPsgCnt);
		result.setWtngHr(prcsPsgCnt == 0 ? 0 : cc.getAvgWaitSec() / SEC_PER_MIN);
		result.setPrcsHr(prcsPsgCnt == 0 ? 0 : cc.getAvgPrcsSec() / SEC_PER_MIN);
		result.setPrcsRate(SmltUtils.toPrcsRate(prcsPsgCnt, cc.getCurrentQueue()));
		result.setWtngPsgCnt(psgWtng == null ? null : psgWtng.getWtngPsgCnt());
		result.setLastWeekWtngPsgCnt(lastWeekPsgWtng == null ? 0 : lastWeekPsgWtng.getWtngPsgCnt());

		return result;
	}

	private List<DsbdRsltDto> retrieveDepRsltByTime(SmltStngDto smltStng, TerminalKind tmnlId) {
		String smltId = smltStng.getSmltId();
		String excnYmd = smltStng.getExcnYmd();
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
		Map<String, Integer> arvlByHour = retrieveArvlByHour(smltStng, tmnlId, DsbdCategory.DEP);

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
			row.setArvlPsgCnt(arvlByHour.get(hour + "00"));
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
			result.setFltCnt(fltPsg.getFltCnt());
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
