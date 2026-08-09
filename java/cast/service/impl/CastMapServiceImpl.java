package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.config.ConditionalOnCastDb;
import aoms.pm.cast.domains.MapLayout;
import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.FltSmryRawDto;
import aoms.pm.cast.dto.MapCgnStatDto;
import aoms.pm.cast.dto.MapChknDetailDto;
import aoms.pm.cast.dto.MapDepDetailDto;
import aoms.pm.cast.dto.MapFcltItemDto;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.dto.MapNoticeDto;
import aoms.pm.cast.dto.MapNoticeItemDto;
import aoms.pm.cast.dto.MapOperCardDto;
import aoms.pm.cast.dto.MapSalesDto;
import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.MapSmryDto;
import aoms.pm.cast.dto.SmltMapDto;
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
 */
@Service
@ConditionalOnCastDb
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastMapServiceImpl implements CastMapService {
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");
	private static final List<String> DEP_FCLT_CD_LIST = List.of("LGT", "SC", "SR");

	private static final String EMPTY = "";
	private static final String USE_YN_Y = "Y";
	private static final String USE_YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String ZERO_MIN = "00";
	private static final String DEP_NM_PREFIX = "출국장 ";

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

		Map<String, SmltRsltRawDto> chknMap = retrieveUnitRsltMap(searchDto, CHKN_FCLT_CD_LIST);
		Map<String, SmltRsltRawDto> depMap = retrieveUnitRsltMap(searchDto, DEP_FCLT_CD_LIST);

		FltSmryRawDto fltSmry = castDsbdMapper.retrieveFltSmry(smltStng.getExcnYmd(), tmnlId.getFltTmnlIdList());

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setHhmm(searchDto.getHhmm());
		result.setSummary(getSummary(fltSmry));
		result.setNotice(getNotice(chknMap, depMap));
		result.setOperCardList(getOperCardList(tmnlId, smltStng));
		result.setDepMarkerList(getDepMarkerList(tmnlId, depMap));
		result.setChknMarkerList(getChknMarkerList(chknMap));
		result.setGateMarkerList(MapLayout.gateMarkerList());

		return result;
	}

	@Override
	public MapChknDetailDto retrieveSmltMapChknDetail(MapSearchDto searchDto) {
		MapChknDetailDto result = new MapChknDetailDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String island = searchDto.getIsland();

		Map<String, SmltRsltRawDto> chknMap = retrieveUnitRsltMap(searchDto, CHKN_FCLT_CD_LIST);
		SmltRsltRawDto rslt = chknMap.get(island);

		result.setIsland(island);
		result.setFcltCd(tmnlId.getValue() + "-3RD-" + island + "01-01");
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
		result.setFcltList(getIslandFcltList(rslt));
		result.setStat(getStat(rslt));
		// 상업시설 매출 원천이 확인되지 않았다 (D7)
		result.setSales(new MapSalesDto());

		return result;
	}

	@Override
	public MapDepDetailDto retrieveSmltMapDepDetail(MapSearchDto searchDto) {
		MapDepDetailDto result = new MapDepDetailDto();
		String depNum = searchDto.getDepNum();

		Map<String, SmltRsltRawDto> depMap = retrieveUnitRsltMap(searchDto, DEP_FCLT_CD_LIST);
		SmltRsltRawDto rslt = depMap.get(depNum);

		result.setDepNum(depNum);
		result.setDepNm(DEP_NM_PREFIX + depNum);
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
		result.setStat(getStat(rslt));

		return result;
	}

	/* ================= 결과 조회 ================= */

	// 상위시설코드가 여러 개 걸린 묶음 단위는 한 건으로 접는다
	private Map<String, SmltRsltRawDto> retrieveUnitRsltMap(MapSearchDto searchDto, List<String> upPsgFcltCdList) {
		List<SmltRsltRawDto> rsltList = castMapMapper.retrieveMapRsltList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), searchDto.getHhmm(), upPsgFcltCdList);

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

	/* ================= 헤더 · 알림 ================= */

	private MapSmryDto getSummary(FltSmryRawDto raw) {
		MapSmryDto result = new MapSmryDto();

		result.setFltCnt(raw.getDepFltCnt());
		result.setPsgCnt(raw.getDepPsgCnt());

		return result;
	}

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
				.withFcltNm(isChkn ? "체크인카운터" : "출국장")
				.withFcltCd(rslt.getUnitCd())
				// 조치 부스 수는 대기인원을 부스 단위로 환산한 값이다 — 정식 산식은 현업 확인 대상
				.withBoothCnt(Math.max(1, rslt.getWtngPsgCnt() / BOOTH_PER_STEP));
	}

	/* ================= 운영시간 카드 ================= */

	private List<MapOperCardDto> getOperCardList(TerminalKind tmnlId, SmltStngDto smltStng) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		Map<String, String> useYnMap = castDepMapper.retrieveDepFcltList(fcltTmnlId).stream()
				.collect(Collectors.toMap(DepFcltRawDto::getDepNum, DepFcltRawDto::getUseYn, (a, b) -> a));
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
		result.setUseYn(USE_YN_Y.equals(useYn) ? USE_YN_Y : USE_YN_N);
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

	private List<MapMarkerDto> getDepMarkerList(TerminalKind tmnlId, Map<String, SmltRsltRawDto> depMap) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String depNum : MapLayout.depNumList(tmnlId)) {
			SmltRsltRawDto rslt = depMap.get(depNum);
			result.add(MapLayout.depMarker(tmnlId, depNum)
					.withCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0)));
		}

		return result;
	}

	private List<MapMarkerDto> getChknMarkerList(Map<String, SmltRsltRawDto> chknMap) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String island : MapLayout.islandCdList()) {
			SmltRsltRawDto rslt = chknMap.get(island);
			result.add(MapLayout.chknMarker(island)
					.withCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0)));
		}

		return result;
	}

	/* ================= 상세 팝업 ================= */

	private List<MapFcltItemDto> getIslandFcltList(SmltRsltRawDto rslt) {
		int prcsRate = rslt == null ? 0 : getPrcsRate(rslt.getTrnstPsgCnt(), rslt.getWtngPsgCnt());
		List<MapFcltItemDto> result = new ArrayList<>();

		result.add(new MapFcltItemDto().withFcltType(FcltType.CHKN).withFcltNm("체크인카운터").withPrcsRate(prcsRate));
		result.add(new MapFcltItemDto().withFcltType(FcltType.SLFCHKN).withFcltNm("셀프체크인").withPrcsRate(prcsRate));
		// 상업시설은 처리율 개념이 없다 — null 로 내려 화면이 항목을 비운다
		result.add(new MapFcltItemDto().withFcltType(FcltType.CMRC).withFcltNm("상업시설").withPrcsRate(null));

		return result;
	}

	// 이 팝업의 시간 지표는 초 단위다 (대시보드 KPI 는 분이라 환산하지 않는다)
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

	/* ================= 시각 ================= */

	private int toBgnHour(String hm) {
		return Integer.parseInt(defaultHm(hm).substring(0, 2));
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

	private String defaultHm(String hm) {
		return hm != null && hm.length() >= 4 ? hm : DEFAULT_HM;
	}
}
