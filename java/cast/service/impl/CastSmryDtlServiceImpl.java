package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.domains.CgnOrder;
import aoms.pm.cast.domains.DepHallLayout;
import aoms.pm.cast.domains.MapLayout;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueKpi;
import aoms.pm.cast.domains.queue.Computed;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngIntrvl;
import aoms.pm.cast.domains.wtng.FcltWtngRecommend;
import aoms.pm.cast.domains.wtng.FcltWtngSlot;
import aoms.pm.cast.dto.ChknCounterDto;
import aoms.pm.cast.dto.ChknCounterIslandDto;
import aoms.pm.cast.dto.ChknCounterRsrcDto;
import aoms.pm.cast.dto.ChknCounterSearchDto;
import aoms.pm.cast.dto.ChknCounterSlotDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallGateDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.DepHallSlotDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
import aoms.pm.cast.dto.MapCgnStatDto;
import aoms.pm.cast.dto.MapChknInfoDto;
import aoms.pm.cast.dto.MapChknRsltDto;
import aoms.pm.cast.dto.MapFcltItemDto;
import aoms.pm.cast.dto.MapLandsideSmryDto;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.dto.MapNoticeDto;
import aoms.pm.cast.dto.MapNoticeItemDto;
import aoms.pm.cast.dto.MapOperCardDto;
import aoms.pm.cast.dto.MapSalesDto;
import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.MapSmryDto;
import aoms.pm.cast.dto.MapUnitRsltDto;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.PsgWtngRawDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltMapDto;
import aoms.pm.cast.dto.SmltMapSlotDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.DsbdCategory;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.PmRole;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.mapper.CastMapMapper;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastFcltWtngService;
import aoms.pm.cast.service.CastOperHrService;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastSmryDtlService;
import aoms.pm.cast.service.UserService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastSmryDtlServiceImpl.java
 * @Description : 일일 시뮬레이션 결과 조회 - 상세(맵형태보기 · 체크인카운터 · 출국장) ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성 (맵형태보기 · 출국장)
 * 2026. 08. 14. / 노세찬 / 최초작성 (체크인카운터)
 * 2026. 09. 04. / 노세찬 / 체크인카운터 아일랜드 공용 Queue 결과로 교체
 * 2026. 11. 15. / 노세찬 / CastMapServiceImpl · CastChknCounterServiceImpl · CastDepHallServiceImpl 통합
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastSmryDtlServiceImpl implements CastSmryDtlService {
	/** 보유 카운터 집계 대상 : A, B 유인 체크인카운터 */
	private static final List<String> BOOTH_USE_CRG_TYPE_CD_LIST = List.of("A", "B");
	/** 아일랜드 마커 색을 맞추기 위한 체크인 구역 시설 */
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");
	private static final List<String> DPTGT_FCLT_CD_LIST = List.of("LGT");

	private static final String EMPTY = "";
	private static final String YN_Y = "Y";
	private static final String YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String CHKN_FCLT_NM = "체크인카운터";
	private static final String DPTGT_FCLT_NM = "출국장";
	private static final String ISLAND_NM_PREFIX = "아일랜드 ";
	private static final String DPTGT_NM_PREFIX = "출국장 ";

	/** 타임라인 시작 시각 — 00:00 부터 24:00 까지 30분 눈금 49칸. 새벽 출발편 때문에 이른 시각도 열고, 출국장 운영 전 시간도 포함한다 */
	private static final int SLOT_BGN_HOUR = 0;

	private static final int HOUR_PER_DAY = 24;
	private static final int SLOT_MIN = 30;
	private static final int MINUTE_PER_HOUR = 60;
	private static final int HHMM_LENGTH = 4;
	private static final int PERCENT = 100;
	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 도면을 덮지 않고 요약 바를 밀어내지 않는 상한
	private static final int BOOTH_PER_STEP = 50; // 대기인원 50명당 부스 1개 증설로 환산한다

	private final CastMapMapper castMapMapper;
	private final CastDsbdMapper castDsbdMapper;
	private final CastDepMapper castDepMapper;
	private final CastChknMapper castChknMapper;
	private final CastSmltService castSmltService;
	private final CastFcltWtngService castFcltWtngService;
	private final CastOperHrService castOperHrService;
	private final CastChknQueueService castChknQueueService;
	private final CastSlfchknService castSlfchknService;
	private final CastChknService castChknService;
	private final UserService userService;
	private final SessionService sessionService;

	/* ======================================================================
	 * 맵형태보기
	 * ====================================================================== */

	@Override
	public SmltMapDto retrieveSmltMap(MapSearchDto searchDto) {
		SmltMapDto result = new SmltMapDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(searchDto.getSmltId());

		// 체크인은 아일랜드 공용 Queue 를, 출국장은 시각 → (묶음 단위 → 결과) 를 읽는다
		FcltWtngDay chknDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.CHKN);
		Map<String, Map<String, SmltRsltRawDto>> dptgtDayMap = retrieveUnitRsltDayMap(searchDto.getSmltId(), tmnlId, DPTGT_FCLT_CD_LIST);
		// 출국장 혼잡등급은 지표 4종과 달리 요약보기 카드와 같은 LGT 처리 여객 평균에서 정한다
		FcltWtngDay depDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.DEP);
		Map<LocalDateTime, Integer> landsideWtngByDt = retrieveLandsideWtngDayMap(smltStng, tmnlId, chknDay);

		FltSmryRawDto fltSmry = castDsbdMapper.retrieveFltSmry(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList(), null, null);

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setSummary(getSummary(fltSmry));
		result.setOperCardList(getOperCardList(tmnlId, smltStng));
		result.setDptgtMarkerList(getMapDptgtMarkerList(tmnlId));
		result.setChknMarkerList(getChknMarkerList(tmnlId));
		result.setGateMarkerList(MapLayout.gateMarkerList());
		result.setChknInfoList(getChknInfoList(tmnlId));
		result.setSlotList(getMapSlotList(tmnlId, chknDay, dptgtDayMap, depDay, landsideWtngByDt));

		return result;
	}

	/* ================= 결과 조회 ================= */

	// 랜드사이드 대기인원은 요약보기 피크시간 · 요약정보와 같은 CAST 원값(CC + LGT 합)이다. 24:00 슬롯까지 읽는다
	private Map<LocalDateTime, Integer> retrieveLandsideWtngDayMap(SmltStngDto smltStng, TerminalKind tmnlId, FcltWtngDay chknDay) {
		return castDsbdMapper.retrieveRsltByUnitList(smltStng.getSmltId(), tmnlId.getFcltTmnlId(),
				chknDay.dtOf(0), chknDay.dtOf(HOUR_PER_DAY * MINUTE_PER_HOUR).plusMinutes(1), null,
				DsbdCategory.PSG.getUpPsgFcltCdList(), smltStng.getSmltMdlSn())
				.stream()
				.collect(Collectors.groupingBy(SmltRsltRawDto::getSmltActlDt, Collectors.summingInt(SmltRsltRawDto::getWtngPsgCnt)));
	}

	/* ================= 헤더 ================= */

	private MapSmryDto getSummary(FltSmryRawDto raw) {
		MapSmryDto result = new MapSmryDto();

		result.setFltCnt(raw.getDepFltCnt());
		result.setPsgCnt(raw.getDepPsgCnt());

		return result;
	}

	/* ================= 운영시간 카드 ================= */

	private List<MapOperCardDto> getOperCardList(TerminalKind tmnlId, SmltStngDto smltStng) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		Map<String, String> useYnMap = castDepMapper.retrieveDepFcltList(fcltTmnlId).stream()
				.collect(Collectors.toMap(DepFcltRawDto::getDptgtNo, DepFcltRawDto::getUseYn, (first, ignored) -> first));
		Map<String, List<DepOperHrRawDto>> operHrMap = castOperHrService
				.retrieveDepOperHrMap(fcltTmnlId, smltStng.getExcnYmd());

		List<MapOperCardDto> result = new ArrayList<>();

		for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
			result.add(toOperCard(dptgtNo, useYnMap.get(dptgtNo), operHrMap.get(dptgtNo)));
		}

		result.sort(Comparator.comparing(MapOperCardDto::getDptgtNo).reversed());

		return result;
	}

	private MapOperCardDto toOperCard(String dptgtNo, String useYn, List<DepOperHrRawDto> operHrList) {
		MapOperCardDto result = new MapOperCardDto();
		result.setDptgtNo(dptgtNo);
		result.setUseYn(YN_Y.equals(useYn) ? YN_Y : YN_N);
		result.setOprBgnTime(EMPTY);
		result.setOprEndTime(EMPTY);

		if (operHrList == null || operHrList.isEmpty()) {
			return result;
		}

		String bgnHm = operHrList.stream()
				.map(operHr -> SmltUtils.defaultHm(operHr.getBgnHm()))
				.min(Comparator.naturalOrder())
				.orElse(DEFAULT_HM);
		String endHm = operHrList.stream()
				.map(operHr -> SmltUtils.defaultHm(operHr.getEndHm()))
				.max(Comparator.naturalOrder())
				.orElse(DEFAULT_HM);
		int oprHr = SmltUtils.toEndHour(bgnHm, endHm) - SmltUtils.toBgnHour(bgnHm);

		result.setOprBgnTime(bgnHm);
		result.setOprEndTime(endHm);
		result.setOprHr(oprHr);
		result.setOprRate(oprHr * PERCENT / HOUR_PER_DAY);

		return result;
	}

	/* ================= 마커 ================= */

	// 마커는 자리/표시 문구만 갖는다 (혼잡도는 슬롯이 채운다)
	private List<MapMarkerDto> getMapDptgtMarkerList(TerminalKind tmnlId) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
			result.add(MapLayout.dptgtMarker(tmnlId, dptgtNo));
		}

		return result;
	}

	private List<MapMarkerDto> getChknMarkerList(TerminalKind tmnlId) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String islandCd : MapLayout.islandCdList(tmnlId)) {
			result.add(MapLayout.chknMarker(tmnlId, islandCd));
		}

		return result;
	}

	/* ================= 아일랜드 상세 팝업 고정 정보 ================= */

	private List<MapChknInfoDto> getChknInfoList(TerminalKind tmnlId) {
		List<MapChknInfoDto> result = new ArrayList<>();
		boolean canViewSales = canViewSales();

		for (String islandCd : MapLayout.islandCdList(tmnlId)) {
			MapChknInfoDto info = new MapChknInfoDto();
			info.setIsland(islandCd);
			info.setFcltCd(tmnlId.getValue() + "-3RD-" + islandCd + "01-01");
			info.setFcltList(getIslandFcltList());
			info.setSales(canViewSales ? getIslandSales() : null);

			result.add(info);
		}

		return result;
	}

	// 매출은 민감정보라 권한 없는 사용자에게는 화면에서 감추는 데 그치지 않고 응답에서 뺀다
	private boolean canViewSales() {
		String loginUserId = sessionService.getLoginUserInfo().getLoginUserId();

		if (loginUserId == null) {
			return false;
		}

		return userService.retrieveRoleIdList(loginUserId).contains(PmRole.SALES.getValue());
	}

	private MapSalesDto getIslandSales() {
		// 상업시설 매출 원천은 아직 없지만 문자열 필드는 API 계약대로 null 없이 내린다
		MapSalesDto result = new MapSalesDto();
		result.setCmprYear(EMPTY);

		return result;
	}

	// 시설 구성은 시각과 무관하다. 처리율 값은 슬롯(MapChknRsltDto)이 갖는다
	private List<MapFcltItemDto> getIslandFcltList() {
		List<MapFcltItemDto> result = new ArrayList<>();

		result.add(new MapFcltItemDto().withFcltType(FcltType.CHKN).withFcltNm(CHKN_FCLT_NM).withPrcsRateYn(YN_Y));
		result.add(new MapFcltItemDto().withFcltType(FcltType.SLFCHKN).withFcltNm("셀프체크인").withPrcsRateYn(YN_Y));
		// 상업시설은 처리율 개념이 없다 — N 으로 내려 화면이 항목을 비운다
		result.add(new MapFcltItemDto().withFcltType(FcltType.CMRC).withFcltNm("상업시설").withPrcsRateYn(YN_N));

		return result;
	}

	/* ================= 슬롯 ================= */

	private List<SmltMapSlotDto> getMapSlotList(
			TerminalKind tmnlId,
			FcltWtngDay chknDay,
			Map<String, Map<String, SmltRsltRawDto>> dptgtDayMap,
			FcltWtngDay depDay,
			Map<LocalDateTime, Integer> landsideWtngByDt) {
		List<SmltMapSlotDto> result = new ArrayList<>();

		for (String hhmm : TimeBucketUtils.slotTimeList(SLOT_BGN_HOUR)) {
			Map<String, SmltRsltRawDto> dptgtMap = dptgtDayMap.getOrDefault(hhmm, Map.of());
			LocalDateTime evalDt = chknDay.dtOf(toMinute(hhmm));
			List<MapChknRsltDto> chknRsltList = getMapChknRsltList(tmnlId, chknDay, evalDt);

			SmltMapSlotDto slot = new SmltMapSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getMapNotice(chknRsltList, dptgtMap, depDay, evalDt));
			slot.setLandsideSmry(getLandsideSmry(chknDay, depDay, evalDt, landsideWtngByDt.get(evalDt)));
			slot.setChknRsltList(chknRsltList);
			slot.setDptgtRsltList(getMapDptgtRsltList(tmnlId, depDay, evalDt));
			slot.setChknCmpr(SmltUtils.toCgnCmpr(chknDay.cmprOf(MapLayout.islandCdList(tmnlId), evalDt, SLOT_MIN)));
			slot.setDptgtCmpr(SmltUtils.toCgnCmpr(depDay.cmprOf(MapLayout.dptgtNoList(tmnlId), evalDt, SLOT_MIN)));

			result.add(slot);
		}

		return result;
	}

	private MapLandsideSmryDto getLandsideSmry(FcltWtngDay chknDay, FcltWtngDay depDay, LocalDateTime evalDt, Integer wtngPsgCnt) {
		LocalDateTime dayEndDt = chknDay.dtOf(HOUR_PER_DAY * MINUTE_PER_HOUR);
		LocalDateTime endDt = evalDt.plusHours(1);
		if (endDt.isAfter(dayEndDt)) {
			endDt = dayEndDt;
		}
		FcltWtngIntrvl intrvl = FcltWtngIntrvl.landsideOf(
				chknDay.intrvlOf(evalDt, endDt), depDay.intrvlOf(evalDt, endDt));
		MapLandsideSmryDto result = new MapLandsideSmryDto();

		result.setSmryWtngPsgCnt(wtngPsgCnt);
		result.setSmryAvgWtngSec(intrvl.getAvgWtngSec());
		result.setSmryArvlPsgCnt(intrvl.getArvlPsgCnt());
		result.setSmryPrcsPsgCnt(intrvl.getPrcsPsgCnt());
		return result;
	}

	/*
	 * 아일랜드 값은 체크인 상세 화면과 같은 공용 Queue 계산기에서 나온다.
	 * 같은 smltId / 터미널 / 시각이면 두 화면의 대기인원과 혼잡등급이 반드시 같아야 한다.
	 * 지표 4종은 슬롯 [hhmm, hhmm+30), 혼잡등급 / 추천은 평가시각 hhmm 의 직전 10분 [hhmm-10, hhmm) 이다.
	 */
	private List<MapChknRsltDto> getMapChknRsltList(TerminalKind tmnlId, FcltWtngDay chknDay, LocalDateTime evalDt) {
		List<MapChknRsltDto> result = new ArrayList<>();

		for (String islandCd : MapLayout.islandCdList(tmnlId)) {
			FcltWtngSlot queueSlot = chknDay.slotOf(islandCd, evalDt, SLOT_MIN);
			FcltWtngRecommend recommend = chknDay.recommendOf(islandCd, evalDt);
			Computed<Double> avgWtngSec = chknDay.avgWtngSecOf(islandCd, evalDt);

			MapChknRsltDto chknRslt = new MapChknRsltDto();
			chknRslt.setUnitCd(islandCd);
			chknRslt.setCgnWtngSec(avgWtngSec.getValue());
			chknRslt.setCgnStatus(chknDay.gradeOf(islandCd, evalDt).getValue());
			chknRslt.setStat(SmltUtils.toCgnStat(queueSlot));
			chknRslt.setPrcsRate(queueSlot.getPrcsRate());
			chknRslt.setAvgQueuePsgCnt(queueSlot.getAvgQueue());
			chknRslt.setMaxQueuePsgCnt(queueSlot.getMaxQueue());
			chknRslt.setOprBoothCnt(queueSlot.getOprBoothCnt());
			chknRslt.setReqCnt(recommend.getReqCnt());
			chknRslt.setCgnClearMin(recommend.getCgnClearMin());

			result.add(chknRslt);
		}

		return result;
	}

	// 지표 4종도 아일랜드와 같은 10분 대기 결과(LGT)에서 접어야 터미널 비교 기준과 정의가 맞는다
	private List<MapUnitRsltDto> getMapDptgtRsltList(TerminalKind tmnlId, FcltWtngDay depDay, LocalDateTime evalDt) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
			Computed<Double> avgWtngSec = depDay.avgWtngSecOf(dptgtNo, evalDt);

			MapUnitRsltDto dptgtRslt = new MapUnitRsltDto();
			dptgtRslt.setUnitCd(dptgtNo);
			dptgtRslt.setCgnWtngSec(avgWtngSec.getValue());
			dptgtRslt.setCgnStatus(depDay.getGradeScale().gradeOf(avgWtngSec).getValue());
			dptgtRslt.setStat(SmltUtils.toCgnStat(depDay.slotOf(dptgtNo, evalDt, SLOT_MIN)));

			result.add(dptgtRslt);
		}

		return result;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 곳만, 평균 대기시간이 긴 순으로 보여준다
	private MapNoticeDto getMapNotice(
			List<MapChknRsltDto> chknRsltList, Map<String, SmltRsltRawDto> dptgtMap, FcltWtngDay depDay, LocalDateTime evalDt) {
		List<NoticeCandidate> candidateList = new ArrayList<>();

		for (MapChknRsltDto rslt : chknRsltList) {
			candidateList.add(new NoticeCandidate(
					rslt.getCgnStatus(),
					rslt.getCgnWtngSec(),
					rslt.getStat().getWtngPsgCnt(),
					CHKN_FCLT_NM + rslt.getUnitCd(),
					new MapNoticeItemDto()
							.withFcltNm(CHKN_FCLT_NM)
							.withFcltCd(rslt.getUnitCd())
							.withBoothCnt(rslt.getOprBoothCnt())
							.withReqCnt(rslt.getReqCnt())
							.withCgnClearMin(rslt.getCgnClearMin())
							.withCgnWtngSec(rslt.getCgnWtngSec())));
		}

		for (SmltRsltRawDto rslt : dptgtMap.values()) {
			Computed<Double> avgWtngSec = depDay.avgWtngSecOf(rslt.getUnitCd(), evalDt);

			candidateList.add(new NoticeCandidate(
					depDay.getGradeScale().gradeOf(avgWtngSec).getValue(),
					avgWtngSec.getValue(),
					rslt.getWtngPsgCnt(),
					DPTGT_FCLT_NM + rslt.getUnitCd(),
					new MapNoticeItemDto()
							.withFcltNm(DPTGT_FCLT_NM)
							.withFcltCd(rslt.getUnitCd())
							// 출국장 조치 부스 수는 대기인원 환산값이다 — 정식 산식은 현업 확인 대상
							.withBoothCnt(Math.max(1, rslt.getWtngPsgCnt() / BOOTH_PER_STEP))
							.withCgnWtngSec(avgWtngSec.getValue())));
		}

		candidateList.sort(CgnOrder.byWaitDesc(NoticeCandidate::getCgnWtngSec, NoticeCandidate::getWtngPsgCnt, NoticeCandidate::getKey));

		List<MapNoticeItemDto> itemList = candidateList.stream()
				.filter(candidate -> candidate.getCgnStatus() == CongestionStatus.BUSY
						|| candidate.getCgnStatus() == CongestionStatus.VERY_BUSY)
				.limit(NOTICE_ITEM_LIMIT)
				.map(NoticeCandidate::getItem)
				.collect(Collectors.toList());

		MapNoticeDto result = new MapNoticeDto();
		result.setCgnStatus(CgnOrder.worstOf(candidateList.stream().map(NoticeCandidate::getCgnStatus).collect(Collectors.toList())));
		result.setItemList(itemList);

		return result;
	}

	/* ======================================================================
	 * 체크인카운터
	 * ====================================================================== */

	@Override
	public ChknCounterDto retrieveChknCounter(ChknCounterSearchDto searchDto) {
		ChknCounterDto result = new ChknCounterDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(searchDto.getSmltId());

		List<CknctCntRawDto> cknctCntList = castChknMapper.retrieveCknctCntList(fcltTmnlId, BOOTH_USE_CRG_TYPE_CD_LIST);
		List<ChknCounterIslandDto> islandList = getIslandList(fcltTmnlId, smltStng, cknctCntList);
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(smltStng, tmnlId);
		// 혼잡등급 / 추천은 요약보기 카드 · 맵형태보기와 같은 10분 대기 결과로 평가한다
		FcltWtngDay wtngDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.CHKN);

		int totCnt = cknctCntList.stream().mapToInt(CknctCntRawDto::getCknctCnt).sum();
		List<ChknCounterRsrcDto> rsrcList = getRsrcList(islandList, queueDay, totCnt);
		ChknQueueKpi queueKpi = queueDay.tmnlSeries().kpi();

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setTotCnt(totCnt);
		result.setOprIslandCnt((int) islandList.stream()
				.filter(island -> YN_Y.equals(island.getUseYn()))
				.count());
		result.setPeakCounterCnt(rsrcList.stream().mapToInt(ChknCounterRsrcDto::getCounterCnt).max().orElse(0));
		result.setTotKioskCnt(islandList.stream().mapToInt(ChknCounterIslandDto::getKioskCnt).sum());
		result.setTotBagDropCnt(islandList.stream().mapToInt(ChknCounterIslandDto::getBagDropCnt).sum());
		result.setWaitMaxCnt(queueKpi.getMaxQueuePsgCnt());
		result.setMaxWaitMin(queueKpi.getMaxWaitMin());
		result.setIslandList(islandList);
		result.setRsrcList(rsrcList);
		result.setSlotList(getChknCounterSlotList(islandList, queueDay, wtngDay, getXovisWtngMap(smltStng.getExcnYmd(), fcltTmnlId)));
		result.setKpi(getKpi(queueKpi));

		return result;
	}

	/* ================= 아일랜드 ================= */

	/*
	 * 아일랜드 목록은 보유 카운터(TN_CA_CKNCT)가 정한다 — 그날 배정이 없어도 자리는 있으므로
	 * 미운영(useYn = N)으로 함께 내려보낸다. 화면이 "G 는 오늘 안 연다"를 그려야 하기 때문이다.
	 */
	private List<ChknCounterIslandDto> getIslandList(
			String fcltTmnlId, SmltStngDto smltStng, List<CknctCntRawDto> cknctCntList) {
		Map<String, List<UserConfigChknDto>> boothMap = castChknService
				.retrieveChknMapGroupByIsland(smltStng.getExcnYmd(), fcltTmnlId);
		Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
				.stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

		List<ChknCounterIslandDto> result = new ArrayList<>();

		for (CknctCntRawDto cknctCnt : cknctCntList) {
			String islandCd = cknctCnt.getIsland();

			result.add(toIsland(
					cknctCnt,
					boothMap.getOrDefault(islandCd, new ArrayList<>()),
					slfDeviceMap.getOrDefault(islandCd, new ArrayList<>())));
		}

		return result;
	}

	private ChknCounterIslandDto toIsland(
			CknctCntRawDto cknctCnt, List<UserConfigChknDto> boothList, List<SlfDeviceCntRawDto> slfDeviceList) {
		ChknCounterIslandDto result = new ChknCounterIslandDto();
		boolean opr = !boothList.isEmpty();

		result.setIsland(cknctCnt.getIsland());
		result.setFcltNm(ISLAND_NM_PREFIX + cknctCnt.getIsland());
		result.setTotCnt(cknctCnt.getCknctCnt());
		// 운영 카운터는 보유 대수가 아니라 그날 배정된 부스 수다 (사용자 시뮬레이션 탭과 같은 기준)
		result.setCounterCnt(boothList.size());
		result.setKioskCnt(opr ? getDeviceCnt(slfDeviceList, SlfType.KIOSK) : 0);
		result.setBagDropCnt(opr ? getDeviceCnt(slfDeviceList, SlfType.SBD) : 0);
		result.setAlnCdList(getAlnCdList(boothList));
		result.setOprTimeList(getOprTimeList(boothList));
		result.setUseYn(opr ? YN_Y : YN_N);

		return result;
	}

	// 배정 항공사 — 부스마다 되풀이되므로 중복을 접고 코드 순으로 둔다
	private List<String> getAlnCdList(List<UserConfigChknDto> boothList) {
		return new ArrayList<>(boothList.stream()
				.map(UserConfigChknDto::getAlnCd)
				.filter(alnCd -> alnCd != null && !alnCd.isEmpty())
				.sorted()
				.collect(Collectors.toCollection(LinkedHashSet::new)));
	}

	// 아일랜드 운영시간 = 부스별 배정 구간을 합친 것 (붙어 있는 구간은 하나로 이어진다)
	private List<OprTimeDto> getOprTimeList(List<UserConfigChknDto> boothList) {
		List<TimeRange> boothTimeRangeList = boothList.stream()
				.flatMap(booth -> booth.getTimeRanges().stream())
				.collect(toList());

		return SmltUtils.mergeTimeRanges(boothTimeRangeList).stream()
				.map(range -> new OprTimeDto().withOperBgngHour(range.getStart()).withOperEndHour(range.getEnd()))
				.collect(toList());
	}

	private int getDeviceCnt(List<SlfDeviceCntRawDto> slfDeviceList, SlfType slfType) {
		return slfDeviceList.stream()
				.filter(device -> slfType == device.getSlfType())
				.mapToInt(SlfDeviceCntRawDto::getDeviceCnt)
				.sum();
	}

	/* ================= 시간대별 자원 ================= */

	/*
	 * 차트 한 칸은 1시간이다. 자원은 운영시간 구간을 시간축으로 펼쳐 더하고, 대기인원은 순간 재고량이라
	 * 두 30분 슬롯을 합산하지 않고 매시 마지막 Queue 를 쓴다.
	 */
	private List<ChknCounterRsrcDto> getRsrcList(
			List<ChknCounterIslandDto> islandList, ChknQueueDay queueDay, int totCnt) {
		List<ChknCounterRsrcDto> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			FcltWtngSlot hourSlot = queueDay.tmnlSeries().slotOf(hourValue * MINUTE_PER_HOUR, MINUTE_PER_HOUR);
			List<ChknCounterIslandDto> oprIslandList = islandList.stream()
					.filter(island -> isOpr(island.getOprTimeList(), hourValue))
					.collect(toList());
			int counterCnt = oprIslandList.stream().mapToInt(ChknCounterIslandDto::getCounterCnt).sum();

			ChknCounterRsrcDto rsrc = new ChknCounterRsrcDto().withHour(hourValue);
			rsrc.setCounterCnt(counterCnt);
			rsrc.setKioskCnt(oprIslandList.stream().mapToInt(ChknCounterIslandDto::getKioskCnt).sum());
			rsrc.setBagDropCnt(oprIslandList.stream().mapToInt(ChknCounterIslandDto::getBagDropCnt).sum());
			rsrc.setWtngPsgCnt(hourSlot.getCurrentQueue());
			rsrc.setPrcsPsgCnt(hourSlot.getPrcsPsgCnt());
			rsrc.setUtilRate(totCnt == 0 ? 0 : counterCnt * PERCENT / totCnt);

			result.add(rsrc);
		}

		return result;
	}

	private boolean isOpr(List<OprTimeDto> oprTimeList, int hour) {
		return oprTimeList.stream()
				.anyMatch(oprTime -> oprTime.getOperBgngHour() <= hour && hour < oprTime.getOperEndHour());
	}

	/* ================= 결과 지표 ================= */

	private SmltKpiDto getKpi(ChknQueueKpi queueKpi) {
		SmltKpiDto result = new SmltKpiDto();

		result.setAvgWaitMin(queueKpi.getAvgWaitMin());
		result.setP95WaitMin(queueKpi.getP95WaitMin());
		result.setMaxQueuePsgCnt(queueKpi.getMaxQueuePsgCnt());
		result.setUtilRate(queueKpi.getUtilRate());

		return result;
	}

	/* ================= 슬롯 ================= */

	private Map<String, Integer> getXovisWtngMap(String excnYmd, String fcltTmnlId) {
		return castChknMapper.retrievePsgWtngSumBySlotList(excnYmd, fcltTmnlId).stream()
				.collect(Collectors.toMap(PsgWtngRawDto::getTime, PsgWtngRawDto::getWtngPsgCnt));
	}

	private List<ChknCounterSlotDto> getChknCounterSlotList(
			List<ChknCounterIslandDto> islandList, ChknQueueDay queueDay, FcltWtngDay wtngDay, Map<String, Integer> xovisWtngMap) {
		List<ChknCounterSlotDto> result = new ArrayList<>();

		for (String hhmm : TimeBucketUtils.slotTimeList(SLOT_BGN_HOUR)) {
			List<MapChknRsltDto> chknRsltList = getChknCounterRsltList(islandList, queueDay, wtngDay, toMinute(hhmm));

			ChknCounterSlotDto slot = new ChknCounterSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getChknCounterNotice(chknRsltList));
			slot.setChknRsltList(chknRsltList);
			slot.setXovisWtngPsgCnt(xovisWtngMap.get(hhmm));

			result.add(slot);
		}

		return result;
	}

	private List<MapChknRsltDto> getChknCounterRsltList(
			List<ChknCounterIslandDto> islandList, ChknQueueDay queueDay, FcltWtngDay wtngDay, int bgnMinute) {
		List<MapChknRsltDto> result = new ArrayList<>();

		for (ChknCounterIslandDto island : islandList) {
			result.add(toChknRslt(island.getIsland(), queueDay, wtngDay, bgnMinute));
		}

		return result;
	}

	// 지표는 슬롯 [hhmm, hhmm+30), 혼잡등급 / 추천은 평가시각 hhmm 의 직전 10분 — 맵형태보기와 같은 규칙이다
	private MapChknRsltDto toChknRslt(String islandCd, ChknQueueDay queueDay, FcltWtngDay wtngDay, int bgnMinute) {
		FcltWtngSlot queueSlot = queueDay.slotOf(islandCd, bgnMinute, SLOT_MIN);
		LocalDateTime evalDt = wtngDay.dtOf(bgnMinute);
		FcltWtngRecommend recommend = wtngDay.recommendOf(islandCd, evalDt);
		Computed<Double> avgWtngSec = wtngDay.avgWtngSecOf(islandCd, evalDt);

		MapCgnStatDto stat = new MapCgnStatDto();
		stat.setWtngPsgCnt(queueSlot.getCurrentQueue());
		stat.setWtngHr(queueSlot.getAvgWaitSec());
		stat.setPrcsPsgCnt(queueSlot.getPrcsPsgCnt());
		stat.setPrcsHr(queueSlot.getAvgPrcsSec());

		MapChknRsltDto result = new MapChknRsltDto();
		result.setUnitCd(islandCd);
		result.setCgnWtngSec(avgWtngSec.getValue());
		result.setCgnStatus(wtngDay.gradeOf(islandCd, evalDt).getValue());
		result.setStat(stat);
		result.setPrcsRate(queueSlot.getPrcsRate());
		result.setAvgQueuePsgCnt(queueSlot.getAvgQueue());
		result.setMaxQueuePsgCnt(queueSlot.getMaxQueue());
		result.setOprBoothCnt(queueSlot.getOprBoothCnt());
		result.setReqCnt(recommend.getReqCnt());
		result.setCgnClearMin(recommend.getCgnClearMin());

		return result;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 아일랜드만, 평균 대기시간이 긴 순으로 보여준다
	private MapNoticeDto getChknCounterNotice(List<MapChknRsltDto> chknRsltList) {
		List<MapChknRsltDto> sortedList = chknRsltList.stream()
				.sorted(CgnOrder.byWaitDesc(MapChknRsltDto::getCgnWtngSec, target -> target.getStat().getWtngPsgCnt(), MapChknRsltDto::getUnitCd))
				.collect(toList());
		List<MapNoticeItemDto> itemList = new ArrayList<>();

		for (MapChknRsltDto rslt : sortedList) {
			CongestionStatus cgnStatus = rslt.getCgnStatus();

			if (cgnStatus != CongestionStatus.BUSY && cgnStatus != CongestionStatus.VERY_BUSY) {
				continue;
			}

			if (itemList.size() >= NOTICE_ITEM_LIMIT) {
				break;
			}

			itemList.add(new MapNoticeItemDto()
					.withFcltNm(ISLAND_NM_PREFIX + rslt.getUnitCd())
					.withFcltCd(rslt.getUnitCd())
					.withBoothCnt(rslt.getOprBoothCnt())
					.withReqCnt(rslt.getReqCnt())
					.withCgnClearMin(rslt.getCgnClearMin())
					.withCgnWtngSec(rslt.getCgnWtngSec()));
		}

		MapNoticeDto result = new MapNoticeDto();
		// 알림 단계는 산정 가능한 아일랜드 중 가장 혼잡한 곳을 따른다 (맵형태보기 / 출국장과 같은 기준)
		result.setCgnStatus(CgnOrder.worstOf(chknRsltList.stream().map(MapChknRsltDto::getCgnStatus).collect(toList())));
		result.setItemList(itemList);

		return result;
	}

	/* ======================================================================
	 * 출국장
	 * ====================================================================== */

	@Override
	public DepHallDto retrieveDepHall(DepHallSearchDto searchDto) {
		DepHallDto result = new DepHallDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveUniqueSmltStng(searchDto.getSmltId());

		List<DepHallGateDto> gateList = getGateList(tmnlId, smltStng);
		List<MapMarkerDto> chknMarkerList = DepHallLayout.islandMarkerList(tmnlId);

		// 시각 → (묶음 단위 → 결과)
		Map<String, Map<String, SmltRsltRawDto>> chknDayMap = retrieveUnitRsltDayMap(searchDto.getSmltId(), tmnlId, CHKN_FCLT_CD_LIST);

		/** 출국장 구역 시설 : 출국장(LGT) */
		FcltWtngDay depDay = castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.DEP);

		// 혼잡등급은 지표 4종과 달리 요약보기 / 맵형태보기와 같은 처리 여객 평균 대기시간 원천에서 정한다
		CgnSource cgnSource = new CgnSource(
				depDay,
				castFcltWtngService.retrieveFcltWtngDay(smltStng, tmnlId, FcltType.CHKN));

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setGateList(gateList);
		result.setDptgtMarkerList(getDepHallDptgtMarkerList(tmnlId));
		result.setChknMarkerList(chknMarkerList);
		result.setGateMarkerList(DepHallLayout.gateMarkerList(tmnlId));
		result.setSlotList(getDepHallSlotList(gateList, chknMarkerList, chknDayMap, cgnSource));

		return result;
	}

	/* ================= 출국장 카드 ================= */

	// 카드는 자리 / 운영시간 / 부스 수만 갖는다 (혼잡도 / 지표는 슬롯이 채운다)
	private List<DepHallGateDto> getGateList(TerminalKind tmnlId, SmltStngDto smltStng) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		Map<String, String> useYnMap = castDepMapper.retrieveDepFcltList(fcltTmnlId).stream()
				.collect(Collectors.toMap(DepFcltRawDto::getDptgtNo, DepFcltRawDto::getUseYn, (first, ignored) -> first));
		Map<String, List<DepOperHrRawDto>> operHrMap = castOperHrService
				.retrieveDepOperHrMap(fcltTmnlId, smltStng.getExcnYmd());
		Map<String, Integer> scCntMap = castDepMapper
				.retrieveScCntList(fcltTmnlId, smltStng.getFcltyOpngScrtyCntrlRsrcId()).stream()
				.collect(Collectors.toMap(ScCntRawDto::getDptgtNo, ScCntRawDto::getScshCntom, (first, ignored) -> first));

		List<DepHallGateDto> result = new ArrayList<>();

		for (String dptgtNo : DepHallLayout.dptgtNoList(tmnlId)) {
			result.add(toGate(tmnlId, dptgtNo, useYnMap.get(dptgtNo), operHrMap.get(dptgtNo), scCntMap.get(dptgtNo)));
		}

		return result;
	}

	private DepHallGateDto toGate(
			TerminalKind tmnlId, String dptgtNo, String useYn, List<DepOperHrRawDto> operHrList, Integer scshCntom) {
		DepHallGateDto result = new DepHallGateDto();
		double[] point = DepHallLayout.cardPoint(tmnlId, dptgtNo);

		result.setDptgtNo(dptgtNo);
		result.setDptgtNm(DPTGT_NM_PREFIX + dptgtNo);
		result.setUseYn(YN_Y.equals(useYn) ? YN_Y : YN_N);
		// 카드의 부스 = 그 출국장에 열려 있는 보안검색대 대수
		result.setBoothCnt(scshCntom != null ? scshCntom : 0);
		result.setOprBgnTime(EMPTY);
		result.setOprEndTime(EMPTY);

		if (point != null) {
			result.setCdntX(point[0]);
			result.setCdntY(point[1]);
		}

		if (operHrList != null && !operHrList.isEmpty()) {
			result.setOprBgnTime(operHrList.stream()
					.map(operHr -> SmltUtils.defaultHm(operHr.getBgnHm()))
					.min(Comparator.naturalOrder())
					.orElse(DEFAULT_HM));
			result.setOprEndTime(operHrList.stream()
					.map(operHr -> SmltUtils.defaultHm(operHr.getEndHm()))
					.max(Comparator.naturalOrder())
					.orElse(DEFAULT_HM));
		}

		return result;
	}

	/* ================= 마커 ================= */

	private List<MapMarkerDto> getDepHallDptgtMarkerList(TerminalKind tmnlId) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String dptgtNo : DepHallLayout.dptgtNoList(tmnlId)) {
			result.add(DepHallLayout.dptgtMarker(tmnlId, dptgtNo));
		}

		return result;
	}

	/* ================= 슬롯 ================= */

	private List<DepHallSlotDto> getDepHallSlotList(
			List<DepHallGateDto> gateList,
			List<MapMarkerDto> chknMarkerList,
			Map<String, Map<String, SmltRsltRawDto>> chknDayMap,
			CgnSource cgnSource) {
		List<DepHallSlotDto> result = new ArrayList<>();
		List<String> dptgtNoList = gateList.stream().map(DepHallGateDto::getDptgtNo).collect(Collectors.toList());

		for (String hhmm : TimeBucketUtils.slotTimeList(SLOT_BGN_HOUR)) {
			LocalDateTime evalDt = cgnSource.depDay.dtOf(toMinute(hhmm));
			List<MapUnitRsltDto> dptgtRsltList = getDepHallDptgtRsltList(gateList, cgnSource.depDay, evalDt);

			DepHallSlotDto slot = new DepHallSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getDepHallNotice(gateList, dptgtRsltList));
			slot.setDptgtRsltList(dptgtRsltList);
			slot.setDptgtCmpr(SmltUtils.toCgnCmpr(cgnSource.depDay.cmprOf(dptgtNoList, evalDt, SLOT_MIN)));
			slot.setChknRsltList(getDepHallChknRsltList(chknMarkerList, chknDayMap.getOrDefault(hhmm, Map.of()), cgnSource.chknDay, evalDt));

			result.add(slot);
		}

		return result;
	}

	private List<MapUnitRsltDto> getDepHallDptgtRsltList(
			List<DepHallGateDto> gateList, FcltWtngDay depDay, LocalDateTime evalDt) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (DepHallGateDto gate : gateList) {
			Computed<Double> avgWtngSec = depDay.avgWtngSecOf(gate.getDptgtNo(), evalDt);

			result.add(toUnitRslt(gate.getDptgtNo(),
					SmltUtils.toCgnStat(depDay.slotOf(gate.getDptgtNo(), evalDt, SLOT_MIN)),
					avgWtngSec, depDay.getGradeScale().gradeOf(avgWtngSec)));
		}

		return result;
	}

	/**
	 * 아일랜드 마커는 위치 참고용이지만 색(혼잡도)은 맞춰야 도면이 맵형태보기와 같게 보인다.
	 * 체크인 결과를 그대로 끌어온다.
	 */
	private List<MapUnitRsltDto> getDepHallChknRsltList(
			List<MapMarkerDto> chknMarkerList, Map<String, SmltRsltRawDto> chknMap, FcltWtngDay chknDay, LocalDateTime evalDt) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (MapMarkerDto marker : chknMarkerList) {
			String islandCd = marker.getLabel();

			result.add(toUnitRslt(
					islandCd,
					SmltUtils.toCgnStat(chknMap.get(islandCd)),
					chknDay.avgWtngSecOf(islandCd, evalDt),
					chknDay.gradeOf(islandCd, evalDt)));
		}

		return result;
	}

	private MapUnitRsltDto toUnitRslt(String unitCd, MapCgnStatDto stat, Computed<Double> avgWtngSec, Computed<CongestionStatus> grade) {
		MapUnitRsltDto result = new MapUnitRsltDto();

		result.setUnitCd(unitCd);
		result.setCgnWtngSec(avgWtngSec.getValue());
		result.setCgnStatus(grade.getValue());
		result.setStat(stat);

		return result;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 출국장만, 평균 대기시간이 긴 순으로 보여준다
	private MapNoticeDto getDepHallNotice(List<DepHallGateDto> gateList, List<MapUnitRsltDto> dptgtRsltList) {
		Map<String, Integer> boothCntMap = gateList.stream()
				.collect(Collectors.toMap(DepHallGateDto::getDptgtNo, DepHallGateDto::getBoothCnt, (first, ignored) -> first));

		List<MapNoticeItemDto> itemList = new ArrayList<>();

		for (MapUnitRsltDto rslt : dptgtRsltList.stream()
				.sorted(CgnOrder.byWaitDesc(MapUnitRsltDto::getCgnWtngSec, target -> target.getStat().getWtngPsgCnt(), MapUnitRsltDto::getUnitCd))
				.collect(Collectors.toList())) {
			CongestionStatus cgnStatus = rslt.getCgnStatus();

			if (cgnStatus != CongestionStatus.BUSY && cgnStatus != CongestionStatus.VERY_BUSY) {
				continue;
			}

			if (itemList.size() < NOTICE_ITEM_LIMIT) {
				itemList.add(new MapNoticeItemDto()
						.withFcltNm(DPTGT_FCLT_NM)
						.withFcltCd(rslt.getUnitCd())
						.withBoothCnt(boothCntMap.getOrDefault(rslt.getUnitCd(), 0))
						.withCgnWtngSec(rslt.getCgnWtngSec()));
			}
		}

		MapNoticeDto result = new MapNoticeDto();
		// 알림 단계는 가장 혼잡한 출국장을 따른다 (맵형태보기와 같은 기준)
		result.setCgnStatus(CgnOrder.worstOf(dptgtRsltList.stream().map(MapUnitRsltDto::getCgnStatus).collect(Collectors.toList())));
		result.setItemList(itemList);

		return result;
	}

	/* ======================================================================
	 * 공통
	 * ====================================================================== */

	private Map<String, Map<String, SmltRsltRawDto>> retrieveUnitRsltDayMap(
			String smltId, TerminalKind tmnlId, List<String> upPsgFcltCdList) {
		return SmltUtils.foldByTimeAndUnitCd(castMapMapper.retrieveMapRsltDayList(
				smltId, tmnlId.getFcltTmnlId(), upPsgFcltCdList));
	}

	private int toMinute(String hhmm) {
		return Integer.parseInt(hhmm.substring(0, 2)) * MINUTE_PER_HOUR
				+ Integer.parseInt(hhmm.substring(2, HHMM_LENGTH));
	}

	private static final class NoticeCandidate {
		private final CongestionStatus cgnStatus;
		private final Double cgnWtngSec;
		private final int wtngPsgCnt;
		private final String key;
		private final MapNoticeItemDto item;

		private NoticeCandidate(CongestionStatus cgnStatus, Double cgnWtngSec, int wtngPsgCnt, String key, MapNoticeItemDto item) {
			this.cgnStatus = cgnStatus;
			this.cgnWtngSec = cgnWtngSec;
			this.wtngPsgCnt = wtngPsgCnt;
			this.key = key;
			this.item = item;
		}

		private CongestionStatus getCgnStatus() {
			return cgnStatus;
		}

		private Double getCgnWtngSec() {
			return cgnWtngSec;
		}

		private int getWtngPsgCnt() {
			return wtngPsgCnt;
		}

		private String getKey() {
			return key;
		}

		private MapNoticeItemDto getItem() {
			return item;
		}
	}

	/** 혼잡등급 원천 — 출국장 LGT 하루치와 체크인 공용 Queue. 슬롯마다 평가시각만 바꿔 읽는다 */
	private static final class CgnSource {
		private final FcltWtngDay depDay;
		private final FcltWtngDay chknDay;

		private CgnSource(FcltWtngDay depDay, FcltWtngDay chknDay) {
			this.depDay = depDay;
			this.chknDay = chknDay;
		}
	}

}
