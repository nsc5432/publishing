package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.domains.MapLayout;
import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueRecommend;
import aoms.pm.cast.domains.chkn.ChknQueueSlot;
import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
import aoms.pm.cast.dto.MapCgnStatDto;
import aoms.pm.cast.dto.MapChknInfoDto;
import aoms.pm.cast.dto.MapChknRsltDto;
import aoms.pm.cast.dto.MapFcltItemDto;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.dto.MapNoticeDto;
import aoms.pm.cast.dto.MapNoticeItemDto;
import aoms.pm.cast.dto.MapOperCardDto;
import aoms.pm.cast.dto.MapSalesDto;
import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.MapSmryDto;
import aoms.pm.cast.dto.MapUnitRsltDto;
import aoms.pm.cast.dto.SmltMapDto;
import aoms.pm.cast.dto.SmltMapSlotDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.PmRole;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.mapper.CastMapMapper;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastMapService;
import aoms.pm.cast.service.CastOperHrService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.UserService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastMapServiceImpl.java
 * @Description : 맵형태보기 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastMapServiceImpl implements CastMapService {
	private static final List<String> DPTGT_FCLT_CD_LIST = List.of("LGT", "SC", "SR");

	private static final String EMPTY = "";
	private static final String YN_Y = "Y";
	private static final String YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String CHKN_FCLT_NM = "체크인카운터";
	private static final String DPTGT_FCLT_NM = "출국장";

	/** 타임라인 시작 시각 — 00:00 부터 24:00 까지 30분 눈금 49칸 */
	private static final int SLOT_BGN_HOUR = 0;

	private static final int HOUR_PER_DAY = 24;
	private static final int SLOT_MIN = 30;
	private static final int MINUTE_PER_HOUR = 60;
	private static final int HHMM_LENGTH = 4;
	private static final int PERCENT = 100;
	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 도면을 덮지 않는 상한
	private static final int BOOTH_PER_STEP = 50; // 대기인원 50명당 부스 1개 증설로 환산한다

	private final CastMapMapper castMapMapper;
	private final CastDsbdMapper castDsbdMapper;
	private final CastDepMapper castDepMapper;
	private final CastSmltService castSmltService;
	private final CastChknQueueService castChknQueueService;
	private final CastOperHrService castOperHrService;
	private final UserService userService;
	private final SessionService sessionService;

	@Override
	public SmltMapDto retrieveSmltMap(MapSearchDto searchDto) {
		SmltMapDto result = new SmltMapDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		// 체크인은 아일랜드 공용 Queue 를, 출국장은 시각 → (묶음 단위 → 결과) 를 읽는다
		ChknQueueDay queueDay = castChknQueueService.retrieveChknQueueDay(
				searchDto.getSmltId(), tmnlId, smltStng.getExcnYmd());
		Map<String, Map<String, SmltRsltRawDto>> dptgtDayMap = retrieveUnitRsltDayMap(searchDto, DPTGT_FCLT_CD_LIST);

		FltSmryRawDto fltSmry = castDsbdMapper.retrieveFltSmry(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList(), null, null);

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setSummary(getSummary(fltSmry));
		result.setOperCardList(getOperCardList(tmnlId, smltStng));
		result.setDptgtMarkerList(getDptgtMarkerList(tmnlId));
		result.setChknMarkerList(getChknMarkerList(tmnlId));
		result.setGateMarkerList(MapLayout.gateMarkerList());
		result.setChknInfoList(getChknInfoList(tmnlId));
		result.setSlotList(getSlotList(tmnlId, queueDay, dptgtDayMap));

		return result;
	}

	/* ================= 결과 조회 ================= */

	private Map<String, Map<String, SmltRsltRawDto>> retrieveUnitRsltDayMap(
			MapSearchDto searchDto, List<String> upPsgFcltCdList) {
		return SmltUtils.foldByTimeAndUnitCd(castMapMapper.retrieveMapRsltDayList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), upPsgFcltCdList));
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

	// 마커는 자리·표시 문구만 갖는다 (혼잡도는 슬롯이 채운다)
	private List<MapMarkerDto> getDptgtMarkerList(TerminalKind tmnlId) {
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

	private List<SmltMapSlotDto> getSlotList(
			TerminalKind tmnlId,
			ChknQueueDay queueDay,
			Map<String, Map<String, SmltRsltRawDto>> dptgtDayMap) {
		List<SmltMapSlotDto> result = new ArrayList<>();

		for (String hhmm : TimeBucketUtils.slotTimeList(SLOT_BGN_HOUR)) {
			Map<String, SmltRsltRawDto> dptgtMap = dptgtDayMap.getOrDefault(hhmm, Map.of());
			List<MapChknRsltDto> chknRsltList = getChknRsltList(tmnlId, queueDay, toMinute(hhmm));

			SmltMapSlotDto slot = new SmltMapSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getNotice(chknRsltList, dptgtMap));
			slot.setChknRsltList(chknRsltList);
			slot.setDptgtRsltList(getDptgtRsltList(tmnlId, dptgtMap));

			result.add(slot);
		}

		return result;
	}

	/*
	 * 아일랜드 값은 체크인 상세 화면과 같은 공용 Queue 계산기에서 나온다.
	 * 같은 smltId · 터미널 · 시각이면 두 화면의 대기인원과 혼잡등급이 반드시 같아야 한다.
	 */
	private List<MapChknRsltDto> getChknRsltList(TerminalKind tmnlId, ChknQueueDay queueDay, int bgnMinute) {
		List<MapChknRsltDto> result = new ArrayList<>();

		for (String islandCd : MapLayout.islandCdList(tmnlId)) {
			ChknQueueSlot queueSlot = queueDay.slotOf(islandCd, bgnMinute, SLOT_MIN);
			ChknQueueRecommend recommend = queueDay.recommendOf(islandCd, bgnMinute, SLOT_MIN);

			MapCgnStatDto stat = new MapCgnStatDto();
			stat.setWtngPsgCnt(queueSlot.getCurrentQueue());
			stat.setWtngHr(queueSlot.getAvgWaitSec());
			stat.setPrcsPsgCnt(queueSlot.getPrcsPsgCnt());
			stat.setPrcsHr(queueSlot.getAvgPrcsSec());

			MapChknRsltDto chknRslt = new MapChknRsltDto();
			chknRslt.setUnitCd(islandCd);
			chknRslt.setCgnStatus(queueDay.statusOf(queueSlot.getCurrentQueue(), "island=" + islandCd));
			chknRslt.setStat(stat);
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

	private int toMinute(String hhmm) {
		return Integer.parseInt(hhmm.substring(0, 2)) * MINUTE_PER_HOUR
				+ Integer.parseInt(hhmm.substring(2, HHMM_LENGTH));
	}

	private List<MapUnitRsltDto> getDptgtRsltList(TerminalKind tmnlId, Map<String, SmltRsltRawDto> dptgtMap) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
			SmltRsltRawDto rslt = dptgtMap.get(dptgtNo);

			MapUnitRsltDto dptgtRslt = new MapUnitRsltDto();
			dptgtRslt.setUnitCd(dptgtNo);
			dptgtRslt.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
			dptgtRslt.setStat(SmltUtils.toCgnStat(rslt));

			result.add(dptgtRslt);
		}

		return result;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 곳만, 혼잡한 순으로 보여준다
	private MapNoticeDto getNotice(List<MapChknRsltDto> chknRsltList, Map<String, SmltRsltRawDto> dptgtMap) {
		List<NoticeCandidate> candidateList = new ArrayList<>();

		for (MapChknRsltDto rslt : chknRsltList) {
			candidateList.add(new NoticeCandidate(
					rslt.getCgnStatus(),
					rslt.getStat().getWtngPsgCnt(),
					new MapNoticeItemDto()
							.withFcltNm(CHKN_FCLT_NM)
							.withFcltCd(rslt.getUnitCd())
							.withBoothCnt(rslt.getOprBoothCnt())
							.withReqCnt(rslt.getReqCnt())
							.withCgnClearMin(rslt.getCgnClearMin())));
		}

		for (SmltRsltRawDto rslt : dptgtMap.values()) {
			candidateList.add(new NoticeCandidate(
					CongestionStatus.ofWtngPsgCnt(rslt.getWtngPsgCnt()),
					rslt.getWtngPsgCnt(),
					new MapNoticeItemDto()
							.withFcltNm(DPTGT_FCLT_NM)
							.withFcltCd(rslt.getUnitCd())
							// 출국장 조치 부스 수는 대기인원 환산값이다 — 정식 산식은 현업 확인 대상
							.withBoothCnt(Math.max(1, rslt.getWtngPsgCnt() / BOOTH_PER_STEP))));
		}

		candidateList.sort(Comparator.comparingInt(NoticeCandidate::getWtngPsgCnt).reversed());

		List<MapNoticeItemDto> itemList = candidateList.stream()
				.filter(candidate -> candidate.getCgnStatus() != CongestionStatus.FREE
						&& candidate.getCgnStatus() != CongestionStatus.NORMAL)
				.limit(NOTICE_ITEM_LIMIT)
				.map(NoticeCandidate::getItem)
				.collect(Collectors.toList());

		MapNoticeDto result = new MapNoticeDto();
		result.setCgnStatus(candidateList.isEmpty()
				? CongestionStatus.FREE
				: candidateList.get(0).getCgnStatus());
		result.setItemList(itemList);

		return result;
	}

	private static final class NoticeCandidate {
		private final CongestionStatus cgnStatus;
		private final int wtngPsgCnt;
		private final MapNoticeItemDto item;

		private NoticeCandidate(CongestionStatus cgnStatus, int wtngPsgCnt, MapNoticeItemDto item) {
			this.cgnStatus = cgnStatus;
			this.wtngPsgCnt = wtngPsgCnt;
			this.item = item;
		}

		private CongestionStatus getCgnStatus() {
			return cgnStatus;
		}

		private int getWtngPsgCnt() {
			return wtngPsgCnt;
		}

		private MapNoticeItemDto getItem() {
			return item;
		}
	}

}
