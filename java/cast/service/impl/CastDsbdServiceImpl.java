package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

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
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.config.ConditionalOnCastDb;
import aoms.pm.cast.dto.BdpsgAnceRawDto;
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
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastDsbdServiceImpl.java
 * @Description : 요약보기(대시보드) ServiceImpl — DB 조회
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * 2026. 08. 19. / 노세찬 / 기상정보 원천(GOOWN.TN_GO_WTHCN_INFO) 연동 (D7 해소)
 * 2026. 08. 19. / 노세찬 / 실적선 원천(PMOWN.TN_PM_PSG_WTNG_INFO) 연동 — 예측선은 시뮬레이션 결과
 * 2026. 08. 19. / 노세찬 / 승객예고 원천(PMOWN.TN_PM_BDPSG_ANCE_RSLT) 연동 (D7 해소) — 실적선은 추후 연동
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 원천이 확인되지 않은 필드(탑승률 · 지난주 비교선 · 추천 조치)는
 * <b>필드를 빼지 않고 기본값</b>으로 내려준다 (결정 로그 D7).
 */
@Service
@ConditionalOnCastDb
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

	private static final int SEC_PER_MIN = 60; // _HR 컬럼(초) → 화면 표시 단위(분)
	private static final int NOON_HOUR = 12;
	private static final int PERCENT = 100;
	private static final int DAYS_A_WEEK = 7;
	private static final int CARD_CNT_LIMIT = 12; // 캐러셀이 감당하는 카드 수 상한

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
		result.setPeak(getPeak(searchDto.getSmltId(), tmnlId));

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

		List<DsbdRsltDto> result = new ArrayList<>();

		// 결과가 없는 시간대는 행이 통째로 없다. 24시간 축은 애플리케이션이 채운다
		for (String hour : TimeBucketUtils.hourList()) {
			result.add(toRsltDto(
					hour,
					rsltMap.get(hour + HOUR_SUFFIX),
					fltPsgMap.get(hour),
					psgWtngMap.get(hour + HOUR_SUFFIX),
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
		List<String> upPsgFcltCdList = getCardFcltCdList(fcltType);

		// 묶음 단위(아일랜드 · 출국장) 별로 접는다. 한 단위에 상위시설코드가 여러 개 걸리므로 여기서 합친다
		Map<String, SmltRsltRawDto> rsltMap = mergeByUnit(castDsbdMapper.retrieveRsltByUnitList(
				searchDto.getSmltId(), fcltTmnlId, searchDto.getHhmm(), upPsgFcltCdList));
		Map<String, FcltUnitRawDto> unitMap = castDsbdMapper.retrieveFcltUnitList(fcltTmnlId, upPsgFcltCdList)
				.stream().collect(Collectors.toMap(FcltUnitRawDto::getUnitCd, Function.identity(), (first, ignored) -> first));

		List<FcltUnitDto> unitList = getUnitList(unitMap, rsltMap);
		List<DsbdFcltCardDto> result = new ArrayList<>();

		// 캐러셀은 혼잡한 곳부터 보여준다 — 사용자가 먼저 볼 카드가 앞이어야 한다
		List<SmltRsltRawDto> ordered = rsltMap.values().stream()
				.sorted(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt).reversed())
				.limit(CARD_CNT_LIMIT)
				.collect(toList());

		for (SmltRsltRawDto rslt : ordered) {
			result.add(getFcltCard(fcltType, rslt, unitMap.get(rslt.getUnitCd()), unitList, searchDto.getHhmm()));
		}

		return result;
	}

	/* ================= 상단 카드 ================= */

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
		Map<String, FltPsgRawDto> hourMap = castDsbdMapper.retrieveHourlyFltPsgList(ymd, tmnlId.getFltTmnlIdList())
				.stream().collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));
		Map<String, BdpsgAnceRawDto> fcstMap = castDsbdMapper.retrieveHourlyBdpsgAnceList(ymd, tmnlId.getFltTmnlIdList())
				.stream().collect(Collectors.toMap(BdpsgAnceRawDto::getHour, Function.identity(), (first, ignored) -> first));

		List<HourlyPsgItemDto> itemList = new ArrayList<>();
		int totPsgCnt = 0;
		int maxPsgCnt = 0;

		for (String hour : TimeBucketUtils.hourList()) {
			FltPsgRawDto raw = hourMap.get(hour);
			BdpsgAnceRawDto fcst = fcstMap.get(hour);
			int psgCnt = raw != null ? raw.getPsgCnt() : 0;
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

	/* ================= 터미널 요약 ================= */

	// 피크는 대기인원이 가장 많은 시간대다
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

	/* ================= 시간대별 결과 ================= */

	private DsbdRsltDto toRsltDto(
			String hour,
			SmltRsltRawDto rslt,
			FltPsgRawDto fltPsg,
			PsgWtngRawDto psgWtng,
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

		// 지난주 비교선의 원천이 확인되지 않았다 (D7)
		result.setLastWeekWtngPsgCnt(0);

		return result;
	}

	// 처리율 = 처리인원 / (처리인원 + 대기인원)
	private int getPrcsRate(int prcsPsgCnt, int wtngPsgCnt) {
		int total = prcsPsgCnt + wtngPsgCnt;

		return total == 0 ? 0 : prcsPsgCnt * PERCENT / total;
	}

	/* ================= 게이트 카드 ================= */

	// 체크인 카드는 유인 카운터 + 셀프 서비스를, 출국장 카드는 출국장 + 검색대를 한 장에 담는다
	private List<String> getCardFcltCdList(FcltType fcltType) {
		if (fcltType == FcltType.DEP) {
			return List.of("LGT", "SC", "SR");
		}

		return List.of("CC", "CK", "SBD");
	}

	private Map<String, SmltRsltRawDto> mergeByUnit(List<SmltRsltRawDto> rsltList) {
		Map<String, SmltRsltRawDto> result = new LinkedHashMap<>();

		for (SmltRsltRawDto rslt : rsltList) {
			String unitCd = rslt.getUnitCd() != null ? rslt.getUnitCd().trim() : EMPTY;

			if (unitCd.isEmpty()) {
				continue;
			}

			SmltRsltRawDto merged = result.get(unitCd);

			if (merged == null) {
				rslt.setUnitCd(unitCd);
				result.put(unitCd, rslt);
				continue;
			}

			// 대기인원은 순간값이라 최댓값, 처리인원은 누계라 합이다
			merged.setWtngPsgCnt(Math.max(merged.getWtngPsgCnt(), rslt.getWtngPsgCnt()));
			merged.setTrnstPsgCnt(merged.getTrnstPsgCnt() + rslt.getTrnstPsgCnt());
			merged.setWtngHr(Math.max(merged.getWtngHr(), rslt.getWtngHr()));
			merged.setPrcsHr(Math.max(merged.getPrcsHr(), rslt.getPrcsHr()));
		}

		return result;
	}

	// 하단 칩은 카드마다 같다 — 터미널의 모든 묶음 단위를 그린다
	private List<FcltUnitDto> getUnitList(Map<String, FcltUnitRawDto> unitMap, Map<String, SmltRsltRawDto> rsltMap) {
		List<FcltUnitDto> result = new ArrayList<>();

		for (FcltUnitRawDto unit : unitMap.values()) {
			String unitCd = unit.getUnitCd() != null ? unit.getUnitCd().trim() : EMPTY;

			if (unitCd.isEmpty()) {
				continue;
			}

			SmltRsltRawDto rslt = rsltMap.get(unitCd);
			int wtngPsgCnt = rslt != null ? rslt.getWtngPsgCnt() : 0;

			result.add(new FcltUnitDto()
					.withUnitCd(unitCd)
					.withCgnStatus(CongestionStatus.ofWtngPsgCnt(wtngPsgCnt))
					.withUseYn(unit.getOprCnt() > 0 ? USE_YN_Y : USE_YN_N));
		}

		return result;
	}

	private DsbdFcltCardDto getFcltCard(
			FcltType fcltType,
			SmltRsltRawDto rslt,
			FcltUnitRawDto unit,
			List<FcltUnitDto> unitList,
			String hhmm
	) {
		boolean isChkn = fcltType != FcltType.DEP;
		String unitCd = rslt.getUnitCd();

		DsbdFcltCardDto result = new DsbdFcltCardDto();
		result.setCardId(fcltType.getValue() + "-" + unitCd);
		result.setFcltType(isChkn ? FcltType.CHKN : FcltType.DEP);
		result.setIsland(isChkn ? unitCd : EMPTY);
		result.setDepNum(isChkn ? EMPTY : unitCd);
		result.setFcltNm(isChkn ? unitCd : unitCd + "번");
		// 카드 부제(예: 좌측 B4~B8)를 만들 배치 정보가 없다 (D7)
		result.setFcltDesc(EMPTY);
		result.setTotCnt(unit != null ? unit.getTotCnt() : 0);
		result.setOprCnt(unit != null ? unit.getOprCnt() : 0);
		result.setWtngPsgCnt(rslt.getWtngPsgCnt());
		result.setHrlyPrcsPsgCnt(rslt.getTrnstPsgCnt());
		result.setHrlyPrcsRate(getPrcsRate(rslt.getTrnstPsgCnt(), rslt.getWtngPsgCnt()));
		// 혼잡해소 예측은 재계산이 필요하다. 예측 API 가 없어 기준 시각을 그대로 둔다 (D7)
		result.setCgnClearTime(hhmm);
		result.setCgnClearRate(0);
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt.getWtngPsgCnt()));
		result.setRecommend(getEmptyRecommend());
		result.setUnitList(unitList);

		return result;
	}

	// 추천 조치 로직(어디에 몇 개를 더 열 것인가)이 정의되지 않았다 (D7)
	private FcltRecommendDto getEmptyRecommend() {
		FcltRecommendDto result = new FcltRecommendDto();

		result.setTargetNm(EMPTY);
		result.setAddCnt(0);
		result.setNeedAssignYn(USE_YN_N);

		return result;
	}

	/* ================= 시각 ================= */

	// 재계산 주기가 확인되지 않아 다음 정시를 예정 시각으로 본다
	private String getNextCalcDt(String lastCalcDt) {
		if (lastCalcDt == null || lastCalcDt.length() != DT_FORMAT.length()) {
			return EMPTY;
		}

		LocalDateTime lastCalc = LocalDateTime.parse(lastCalcDt, DateTimeFormatter.ofPattern(DT_FORMAT));

		return lastCalc.plusHours(1).withMinute(0).withSecond(0).format(DateTimeFormatter.ofPattern(DT_FORMAT));
	}

	private LocalDate parseYmd(String ymd) {
		return LocalDate.parse(ymd, DateTimeFormatter.ofPattern(YMD_FORMAT));
	}

	private String formatYmd(LocalDate date) {
		return date.format(DateTimeFormatter.ofPattern(YMD_FORMAT));
	}
}
