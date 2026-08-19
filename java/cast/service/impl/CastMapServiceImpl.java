package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.MapLayout;
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
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.mapper.CastMapMapper;
import aoms.pm.cast.service.CastMapService;
import aoms.pm.cast.service.CastSmltService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastMapServiceImpl.java
 * @Description : 맵형태보기 ServiceImpl — DB 조회
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
 *
 * <b>마커 좌표는 DB 가 아니라 {@link MapLayout} 이 준다</b> — 좌표 테이블이 확인되지 않았다 (G1).
 * 결과 테이블에서는 혼잡도·지표만 채운다.
 *
 * <p>
 * 결과는 <b>한 번</b> 읽어 30분 슬롯으로 펼친다. 화면이 타임라인을 옮길 때마다 조회하던 구조를
 * 하루치 일괄 조회로 바꾼 것이라, 마커 색과 상세 팝업 값이 모두 슬롯 안에 들어 있다.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastMapServiceImpl implements CastMapService {
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");
	private static final List<String> DEP_FCLT_CD_LIST = List.of("LGT", "SC", "SR");

	private static final String EMPTY = "";
	private static final String YN_Y = "Y";
	private static final String YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String ZERO_MIN = "00";
	private static final String CHKN_FCLT_NM = "체크인카운터";
	private static final String DEP_FCLT_NM = "출국장";

	/** 타임라인 구간 : 00:00 ~ 24:00 을 30분으로 나눈다 (49칸) */
	private static final int SLOT_BGN_MIN = 0;
	private static final int SLOT_END_MIN = 24 * 60;
	private static final int SLOT_STEP_MIN = 30;

	private static final int MINUTE_PER_HOUR = 60;
	private static final int HOUR_PER_DAY = 24;
	private static final int PERCENT = 100;
	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 도면을 덮지 않는 상한
	private static final int BOOTH_PER_STEP = 50; // 대기인원 50명당 부스 1개 증설로 환산한다

	private final CastMapMapper castMapMapper;
	private final CastDsbdMapper castDsbdMapper;
	private final CastDepMapper castDepMapper;
	private final CastSmltService castSmltService;

	@Override
	public SmltMapDto retrieveSmltMap(MapSearchDto searchDto) {
		SmltMapDto result = new SmltMapDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		// 시각 → (묶음 단위 → 결과)
		Map<String, Map<String, SmltRsltRawDto>> chknDayMap = retrieveUnitRsltDayMap(searchDto, CHKN_FCLT_CD_LIST);
		Map<String, Map<String, SmltRsltRawDto>> depDayMap = retrieveUnitRsltDayMap(searchDto, DEP_FCLT_CD_LIST);

		FltSmryRawDto fltSmry = castDsbdMapper.retrieveFltSmry(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList());

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setSummary(getSummary(fltSmry));
		result.setOperCardList(getOperCardList(tmnlId, smltStng));
		result.setDepMarkerList(getDepMarkerList(tmnlId));
		result.setChknMarkerList(getChknMarkerList(tmnlId));
		result.setGateMarkerList(MapLayout.gateMarkerList());
		result.setChknInfoList(getChknInfoList(tmnlId));
		result.setSlotList(getSlotList(tmnlId, chknDayMap, depDayMap));

		return result;
	}

	/* ================= 결과 조회 ================= */

	// 하루치를 시각별로 나누고, 상위시설코드가 여러 개 걸린 묶음 단위는 한 건으로 접는다
	private Map<String, Map<String, SmltRsltRawDto>> retrieveUnitRsltDayMap(
			MapSearchDto searchDto, List<String> upPsgFcltCdList) {
		List<SmltRsltRawDto> rsltList = castMapMapper.retrieveMapRsltDayList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), upPsgFcltCdList);

		Map<String, List<SmltRsltRawDto>> timeMap = rsltList.stream()
				.collect(Collectors.groupingBy(SmltRsltRawDto::getTime, LinkedHashMap::new, Collectors.toList()));

		Map<String, Map<String, SmltRsltRawDto>> result = new LinkedHashMap<>();

		for (Map.Entry<String, List<SmltRsltRawDto>> entry : timeMap.entrySet()) {
			result.put(entry.getKey(), foldByUnitCd(entry.getValue()));
		}

		return result;
	}

	// 대기는 가장 나쁜 값(최댓값), 처리인원은 합산
	private Map<String, SmltRsltRawDto> foldByUnitCd(List<SmltRsltRawDto> rsltList) {
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

			merged.setWtngPsgCnt(Math.max(merged.getWtngPsgCnt(), rslt.getWtngPsgCnt()));
			merged.setTrnstPsgCnt(merged.getTrnstPsgCnt() + rslt.getTrnstPsgCnt());
			merged.setWtngHr(Math.max(merged.getWtngHr(), rslt.getWtngHr()));
			merged.setPrcsHr(Math.max(merged.getPrcsHr(), rslt.getPrcsHr()));
		}

		return result;
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
				.collect(Collectors.toMap(DepFcltRawDto::getDepNum, DepFcltRawDto::getUseYn, (first, ignored) -> first));
		Map<String, List<DepOperHrRawDto>> operHrMap = castDepMapper
				.retrieveDepOperHrList(fcltTmnlId, smltStng.getFcltyOpngTblDgRsrcId(), smltStng.getExcnYmd())
				.stream().collect(Collectors.groupingBy(DepOperHrRawDto::getDepNum));

		List<MapOperCardDto> result = new ArrayList<>();

		for (String depNum : MapLayout.depNumList(tmnlId)) {
			result.add(toOperCard(depNum, useYnMap.get(depNum), operHrMap.get(depNum)));
		}

		return result;
	}

	private MapOperCardDto toOperCard(String depNum, String useYn, List<DepOperHrRawDto> operHrList) {
		MapOperCardDto result = new MapOperCardDto();
		result.setDepNum(depNum);
		result.setUseYn(YN_Y.equals(useYn) ? YN_Y : YN_N);
		result.setOprBgnTime(EMPTY);
		result.setOprEndTime(EMPTY);

		if (operHrList == null || operHrList.isEmpty()) {
			return result;
		}

		String bgnHm = operHrList.stream().map(x -> defaultHm(x.getBgnHm())).min(Comparator.naturalOrder()).orElse(DEFAULT_HM);
		String endHm = operHrList.stream().map(x -> defaultHm(x.getEndHm())).max(Comparator.naturalOrder()).orElse(DEFAULT_HM);
		int oprHr = toEndHour(bgnHm, endHm) - toBgnHour(bgnHm);

		result.setOprBgnTime(bgnHm);
		result.setOprEndTime(endHm);
		result.setOprHr(oprHr);
		result.setOprRate(oprHr * PERCENT / HOUR_PER_DAY);

		return result;
	}

	/* ================= 마커 ================= */

	// 마커는 자리·표시 문구만 갖는다 (혼잡도는 슬롯이 채운다)
	private List<MapMarkerDto> getDepMarkerList(TerminalKind tmnlId) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String depNum : MapLayout.depNumList(tmnlId)) {
			result.add(MapLayout.depMarker(tmnlId, depNum));
		}

		return result;
	}

	private List<MapMarkerDto> getChknMarkerList(TerminalKind tmnlId) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String island : MapLayout.islandCdList(tmnlId)) {
			result.add(MapLayout.chknMarker(tmnlId, island));
		}

		return result;
	}

	/* ================= 아일랜드 상세 팝업 고정 정보 ================= */

	private List<MapChknInfoDto> getChknInfoList(TerminalKind tmnlId) {
		List<MapChknInfoDto> result = new ArrayList<>();

		for (String island : MapLayout.islandCdList(tmnlId)) {
			MapChknInfoDto info = new MapChknInfoDto();
			info.setIsland(island);
			info.setFcltCd(tmnlId.getValue() + "-3RD-" + island + "01-01");
			info.setFcltList(getIslandFcltList());
			// 상업시설 매출 원천이 확인되지 않았다 (D7)
			info.setSales(new MapSalesDto());

			result.add(info);
		}

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
			Map<String, Map<String, SmltRsltRawDto>> chknDayMap,
			Map<String, Map<String, SmltRsltRawDto>> depDayMap) {
		List<SmltMapSlotDto> result = new ArrayList<>();

		for (String hhmm : getTimeList()) {
			Map<String, SmltRsltRawDto> chknMap = defaultMap(chknDayMap.get(hhmm));
			Map<String, SmltRsltRawDto> depMap = defaultMap(depDayMap.get(hhmm));

			SmltMapSlotDto slot = new SmltMapSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getNotice(chknMap, depMap));
			slot.setChknRsltList(getChknRsltList(tmnlId, chknMap));
			slot.setDepRsltList(getDepRsltList(tmnlId, depMap));

			result.add(slot);
		}

		return result;
	}

	/**
	 * 00:00 ~ 24:00 을 30분으로 나눈 눈금 — 하단 타임라인과 같은 구간이다.
	 * 결과가 없는 구간도 자리를 비워 두지 않는다 (마지막 2400 은 하루의 끝을 닫는 눈금이라
	 * 결과 버킷(…2330)이 없어 항상 0 이다).
	 */
	private List<String> getTimeList() {
		List<String> result = new ArrayList<>();

		for (int minutes = SLOT_BGN_MIN; minutes <= SLOT_END_MIN; minutes += SLOT_STEP_MIN) {
			result.add(toHhmm(minutes));
		}

		return result;
	}

	private List<MapChknRsltDto> getChknRsltList(TerminalKind tmnlId, Map<String, SmltRsltRawDto> chknMap) {
		List<MapChknRsltDto> result = new ArrayList<>();

		for (String island : MapLayout.islandCdList(tmnlId)) {
			SmltRsltRawDto rslt = chknMap.get(island);

			MapChknRsltDto item = new MapChknRsltDto();
			item.setUnitCd(island);
			item.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
			item.setStat(getStat(rslt));
			item.setPrcsRate(rslt != null ? getPrcsRate(rslt.getTrnstPsgCnt(), rslt.getWtngPsgCnt()) : 0);

			result.add(item);
		}

		return result;
	}

	private List<MapUnitRsltDto> getDepRsltList(TerminalKind tmnlId, Map<String, SmltRsltRawDto> depMap) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (String depNum : MapLayout.depNumList(tmnlId)) {
			SmltRsltRawDto rslt = depMap.get(depNum);

			MapUnitRsltDto item = new MapUnitRsltDto();
			item.setUnitCd(depNum);
			item.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
			item.setStat(getStat(rslt));

			result.add(item);
		}

		return result;
	}

	// 이 화면의 시간 지표는 초 단위다 (대시보드 KPI 는 분이라 환산하지 않는다)
	private MapCgnStatDto getStat(SmltRsltRawDto rslt) {
		MapCgnStatDto result = new MapCgnStatDto();

		if (rslt == null) {
			return result;
		}

		result.setWtngPsgCnt(rslt.getWtngPsgCnt());
		result.setWtngHr(rslt.getWtngHr());
		result.setPrcsPsgCnt(rslt.getTrnstPsgCnt());
		result.setPrcsHr(rslt.getPrcsHr());

		return result;
	}

	private int getPrcsRate(int prcsPsgCnt, int wtngPsgCnt) {
		int total = prcsPsgCnt + wtngPsgCnt;

		return total == 0 ? 0 : prcsPsgCnt * PERCENT / total;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 곳만, 혼잡한 순으로 보여준다
	private MapNoticeDto getNotice(Map<String, SmltRsltRawDto> chknMap, Map<String, SmltRsltRawDto> depMap) {
		List<SmltRsltRawDto> candidates = new ArrayList<>(chknMap.values());
		candidates.addAll(depMap.values());

		List<MapNoticeItemDto> itemList = new ArrayList<>();
		int maxWtngPsgCnt = 0;

		for (SmltRsltRawDto rslt : candidates.stream()
				.sorted(Comparator.comparingInt(SmltRsltRawDto::getWtngPsgCnt).reversed())
				.collect(Collectors.toList())) {
			CongestionStatus cgnStatus = CongestionStatus.ofWtngPsgCnt(rslt.getWtngPsgCnt());

			if (cgnStatus == CongestionStatus.FREE || cgnStatus == CongestionStatus.NORMAL) {
				continue;
			}

			maxWtngPsgCnt = Math.max(maxWtngPsgCnt, rslt.getWtngPsgCnt());

			if (itemList.size() < NOTICE_ITEM_LIMIT) {
				itemList.add(toNoticeItem(rslt, chknMap.containsKey(rslt.getUnitCd())));
			}
		}

		MapNoticeDto result = new MapNoticeDto();
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(maxWtngPsgCnt));
		result.setItemList(itemList);

		return result;
	}

	private MapNoticeItemDto toNoticeItem(SmltRsltRawDto rslt, boolean isChkn) {
		return new MapNoticeItemDto()
				.withFcltNm(isChkn ? CHKN_FCLT_NM : DEP_FCLT_NM)
				.withFcltCd(rslt.getUnitCd())
				// 조치 부스 수는 대기인원을 부스 단위로 환산한 값이다 — 정식 산식은 현업 확인 대상
				.withBoothCnt(Math.max(1, rslt.getWtngPsgCnt() / BOOTH_PER_STEP));
	}

	/* ================= 시각 ================= */

	private Map<String, SmltRsltRawDto> defaultMap(Map<String, SmltRsltRawDto> rsltMap) {
		return rsltMap != null ? rsltMap : Collections.emptyMap();
	}

	// 24:00 은 다음 날 00:00 이 아니라 마지막 눈금이라 2400 그대로 둔다
	private String toHhmm(int minutes) {
		return String.format("%02d%02d", minutes / MINUTE_PER_HOUR, minutes % MINUTE_PER_HOUR);
	}

	private int toBgnHour(String hhmm) {
		return Integer.parseInt(defaultHm(hhmm).substring(0, 2));
	}

	// 종료 시각은 분이 남으면 다음 시로 올린다. 자정 넘김(RON)은 당일 24시로 자른다
	private int toEndHour(String bgnHm, String endHm) {
		String value = defaultHm(endHm);
		int hour = Integer.parseInt(value.substring(0, 2));

		if (!ZERO_MIN.equals(value.substring(2, 4))) {
			hour++;
		}

		return hour <= toBgnHour(bgnHm) ? HOUR_PER_DAY : hour;
	}

	private String defaultHm(String hhmm) {
		return hhmm != null && hhmm.length() >= 4 ? hhmm : DEFAULT_HM;
	}
}
