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
import aoms.pm.cast.domains.DepHallLayout;
import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallGateDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.DepHallTrendDto;
import aoms.pm.cast.dto.DepHallTrendItemDto;
import aoms.pm.cast.dto.DepHallTrendSeriesDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.MapCgnStatDto;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.dto.MapNoticeDto;
import aoms.pm.cast.dto.MapNoticeItemDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepHallMapper;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.mapper.CastMapMapper;
import aoms.pm.cast.service.CastDepHallService;
import aoms.pm.cast.service.CastSmltService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastDepHallServiceImpl.java
 * @Description : 일일 시뮬레이션 결과 조회 - 출국장 ServiceImpl — DB 조회
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
 * 한 시각의 결과는 맵형태보기와 같은 statement 를 쓴다 (같은 결과 테이블을 출국장으로만 좁힌 것이다).
 * <b>마커·카드 좌표는 DB 가 아니라 {@link DepHallLayout} 이 준다</b> — 좌표 테이블이 확인되지 않았다 (G1).
 */
@Service
@ConditionalOnCastDb
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastDepHallServiceImpl implements CastDepHallService {
	/** 출국장 구역 시설 : 출국장(LGT) + 보안검색대(SC / SR) */
	private static final List<String> DEP_FCLT_CD_LIST = List.of("LGT", "SC", "SR");

	/** 아일랜드 마커 색을 맞추기 위한 체크인 구역 시설 */
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");

	private static final String EMPTY = "";
	private static final String USE_YN_Y = "Y";
	private static final String USE_YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String DEP_NM_PREFIX = "출국장 ";
	private static final String FCLT_NM = "출국장";

	/** 타임라인 구간 : 04:00 ~ 24:00 을 30분으로 나눈다 (출국장은 04시 전에 열지 않는다) */
	private static final int TREND_BGN_MIN = 4 * 60;
	private static final int TREND_END_MIN = 24 * 60;
	private static final int TREND_STEP_MIN = 30;

	private static final int MINUTE_PER_HOUR = 60;
	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 도면을 덮지 않는 상한

	private final CastMapMapper castMapMapper;
	private final CastDepHallMapper castDepHallMapper;
	private final CastDepMapper castDepMapper;
	private final CastSmltService castSmltService;

	@Override
	public DepHallDto retrieveDepHall(DepHallSearchDto searchDto) {
		DepHallDto result = new DepHallDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		Map<String, SmltRsltRawDto> depMap = retrieveDepRsltMap(searchDto);
		List<DepHallGateDto> gateList = getGateList(tmnlId, smltStng, depMap);

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setHhmm(searchDto.getHhmm());
		result.setNotice(getNotice(gateList));
		result.setGateList(gateList);
		result.setDepMarkerList(getDepMarkerList(tmnlId, gateList));
		result.setChknMarkerList(getChknMarkerList(tmnlId, searchDto));
		result.setGateMarkerList(DepHallLayout.gateMarkerList(tmnlId));

		return result;
	}

	@Override
	public DepHallTrendDto retrieveDepHallTrend(DepHallSearchDto searchDto) {
		DepHallTrendDto result = new DepHallTrendDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		List<String> timeList = getTimeList();

		// 시각 → (출국장 → 결과) 로 접어 두고 배치 순서대로 꺼낸다
		Map<String, Map<String, SmltRsltRawDto>> rsltMap = retrieveTrendRsltMap(searchDto);

		List<DepHallTrendSeriesDto> seriesList = new ArrayList<>();

		for (String depNum : DepHallLayout.depNumList(tmnlId)) {
			DepHallTrendSeriesDto series = new DepHallTrendSeriesDto();
			series.setDepNum(depNum);
			series.setDepNm(DEP_NM_PREFIX + depNum);
			series.setItemList(getTrendItemList(timeList, rsltMap, depNum));

			seriesList.add(series);
		}

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setTimeList(timeList);
		result.setSeriesList(seriesList);

		return result;
	}

	/* ================= 결과 조회 ================= */

	// 출국장 하나에 시설(출국장 게이트 · 보안검색대)이 여러 개 걸리므로 한 건으로 접는다
	private Map<String, SmltRsltRawDto> retrieveDepRsltMap(DepHallSearchDto searchDto) {
		List<SmltRsltRawDto> rsltList = castMapMapper.retrieveMapRsltList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), searchDto.getHhmm(),
				DEP_FCLT_CD_LIST);

		return foldByUnitCd(rsltList);
	}

	private Map<String, Map<String, SmltRsltRawDto>> retrieveTrendRsltMap(DepHallSearchDto searchDto) {
		List<SmltRsltRawDto> rsltList = castDepHallMapper.retrieveDepHallTrendList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), DEP_FCLT_CD_LIST);

		Map<String, List<SmltRsltRawDto>> timeMap = rsltList.stream()
				.collect(Collectors.groupingBy(SmltRsltRawDto::getTime, LinkedHashMap::new, Collectors.toList()));

		Map<String, Map<String, SmltRsltRawDto>> result = new LinkedHashMap<>();

		for (Map.Entry<String, List<SmltRsltRawDto>> entry : timeMap.entrySet()) {
			result.put(entry.getKey(), foldByUnitCd(entry.getValue()));
		}

		return result;
	}

	// 대기는 가장 나쁜 값(최댓값), 처리인원은 합산 — 맵형태보기와 같은 규칙이다
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

	/* ================= 출국장 카드 ================= */

	private List<DepHallGateDto> getGateList(
			TerminalKind tmnlId, SmltStngDto smltStng, Map<String, SmltRsltRawDto> depMap) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		Map<String, String> useYnMap = castDepMapper.retrieveDepFcltList(fcltTmnlId).stream()
				.collect(Collectors.toMap(DepFcltRawDto::getDepNum, DepFcltRawDto::getUseYn, (first, ignored) -> first));
		Map<String, List<DepOperHrRawDto>> operHrMap = castDepMapper
				.retrieveDepOperHrList(fcltTmnlId, smltStng.getFcltyOpngTblDgRsrcId(), smltStng.getExcnYmd())
				.stream().collect(Collectors.groupingBy(DepOperHrRawDto::getDepNum));
		Map<String, Integer> scCntMap = castDepMapper
				.retrieveScCntList(fcltTmnlId, smltStng.getFcltyOpngTblScrtyCntrlRsrcId()).stream()
				.collect(Collectors.toMap(ScCntRawDto::getDepNum, ScCntRawDto::getScCnt, (first, ignored) -> first));

		List<DepHallGateDto> result = new ArrayList<>();

		for (String depNum : DepHallLayout.depNumList(tmnlId)) {
			result.add(toGate(tmnlId, depNum, useYnMap.get(depNum), operHrMap.get(depNum),
					scCntMap.get(depNum), depMap.get(depNum)));
		}

		return result;
	}

	private DepHallGateDto toGate(
			TerminalKind tmnlId, String depNum, String useYn, List<DepOperHrRawDto> operHrList,
			Integer scCnt, SmltRsltRawDto rslt) {
		DepHallGateDto result = new DepHallGateDto();
		double[] point = DepHallLayout.cardPoint(tmnlId, depNum);

		result.setDepNum(depNum);
		result.setDepNm(DEP_NM_PREFIX + depNum);
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
		result.setUseYn(USE_YN_Y.equals(useYn) ? USE_YN_Y : USE_YN_N);
		// 카드의 부스 = 그 출국장에 열려 있는 보안검색대 대수
		result.setBoothCnt(scCnt != null ? scCnt : 0);
		result.setStat(getStat(rslt));
		result.setOprBgnTime(EMPTY);
		result.setOprEndTime(EMPTY);

		if (point != null) {
			result.setCdntX(point[0]);
			result.setCdntY(point[1]);
		}

		if (operHrList != null && !operHrList.isEmpty()) {
			result.setOprBgnTime(operHrList.stream().map(x -> defaultHm(x.getBgnHm()))
					.min(Comparator.naturalOrder()).orElse(DEFAULT_HM));
			result.setOprEndTime(operHrList.stream().map(x -> defaultHm(x.getEndHm()))
					.max(Comparator.naturalOrder()).orElse(DEFAULT_HM));
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

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 출국장만, 혼잡한 순으로 보여준다
	private MapNoticeDto getNotice(List<DepHallGateDto> gateList) {
		List<MapNoticeItemDto> itemList = new ArrayList<>();
		int maxWtngPsgCnt = 0;

		for (DepHallGateDto gate : gateList.stream()
				.sorted(Comparator.comparingInt((DepHallGateDto target) -> target.getStat().getWtngPsgCnt()).reversed())
				.collect(Collectors.toList())) {
			CongestionStatus cgnStatus = gate.getCgnStatus();

			if (cgnStatus == CongestionStatus.FREE || cgnStatus == CongestionStatus.NORMAL) {
				continue;
			}

			maxWtngPsgCnt = Math.max(maxWtngPsgCnt, gate.getStat().getWtngPsgCnt());

			if (itemList.size() < NOTICE_ITEM_LIMIT) {
				itemList.add(new MapNoticeItemDto()
						.withFcltNm(FCLT_NM)
						.withFcltCd(gate.getDepNum())
						.withBoothCnt(gate.getBoothCnt()));
			}
		}

		MapNoticeDto result = new MapNoticeDto();
		// 알림 단계는 가장 혼잡한 출국장을 따른다 (맵형태보기와 같은 기준)
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(maxWtngPsgCnt));
		result.setItemList(itemList);

		return result;
	}

	/* ================= 마커 ================= */

	private List<MapMarkerDto> getDepMarkerList(TerminalKind tmnlId, List<DepHallGateDto> gateList) {
		Map<String, CongestionStatus> statusMap = gateList.stream()
				.collect(Collectors.toMap(DepHallGateDto::getDepNum, DepHallGateDto::getCgnStatus, (first, ignored) -> first));

		List<MapMarkerDto> result = new ArrayList<>();

		for (String depNum : DepHallLayout.depNumList(tmnlId)) {
			result.add(DepHallLayout.depMarker(tmnlId, depNum).withCgnStatus(statusMap.get(depNum)));
		}

		return result;
	}

	/**
	 * 아일랜드 마커는 위치 참고용이지만 색(혼잡도)은 맞춰야 도면이 맵형태보기와 같게 보인다.
	 * 체크인 결과를 그대로 끌어온다.
	 */
	private List<MapMarkerDto> getChknMarkerList(TerminalKind tmnlId, DepHallSearchDto searchDto) {
		Map<String, SmltRsltRawDto> chknMap = foldByUnitCd(castMapMapper.retrieveMapRsltList(
				searchDto.getSmltId(), tmnlId.getFcltTmnlId(), searchDto.getHhmm(),
				CHKN_FCLT_CD_LIST));

		List<MapMarkerDto> result = new ArrayList<>();

		for (MapMarkerDto marker : DepHallLayout.islandMarkerList(tmnlId)) {
			SmltRsltRawDto rslt = chknMap.get(marker.getLabel());
			result.add(marker.withCgnStatus(
					CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0)));
		}

		return result;
	}

	/* ================= 추이 ================= */

	/**
	 * 04:00 ~ 24:00 을 30분으로 나눈 눈금 — 하단 타임라인과 같은 구간이라 x 축이 슬라이더와 맞는다.
	 * 결과가 없는 구간도 자리를 비워 두지 않는다 (마지막 2400 은 하루의 끝을 닫는 눈금이라
	 * 결과 버킷(…2330)이 없어 항상 0 이다).
	 */
	private List<String> getTimeList() {
		List<String> result = new ArrayList<>();

		for (int minutes = TREND_BGN_MIN; minutes <= TREND_END_MIN; minutes += TREND_STEP_MIN) {
			result.add(toHhmm(minutes));
		}

		return result;
	}

	private List<DepHallTrendItemDto> getTrendItemList(
			List<String> timeList, Map<String, Map<String, SmltRsltRawDto>> rsltMap, String depNum) {
		List<DepHallTrendItemDto> result = new ArrayList<>();

		for (String hhmm : timeList) {
			Map<String, SmltRsltRawDto> depMap = rsltMap.get(hhmm);
			SmltRsltRawDto rslt = depMap != null ? depMap.get(depNum) : null;

			DepHallTrendItemDto item = new DepHallTrendItemDto().withHhmm(hhmm);

			if (rslt != null) {
				item.setWtngPsgCnt(rslt.getWtngPsgCnt());
				item.setWtngHr(rslt.getWtngHr());
				item.setPrcsPsgCnt(rslt.getTrnstPsgCnt());
				item.setPrcsHr(rslt.getPrcsHr());
			}

			result.add(item);
		}

		return result;
	}

	/* ================= 시각 ================= */

	// 24:00 은 다음 날 00:00 이 아니라 마지막 눈금이라 2400 그대로 둔다
	private String toHhmm(int minutes) {
		return String.format("%02d%02d", minutes / MINUTE_PER_HOUR, minutes % MINUTE_PER_HOUR);
	}

	private String defaultHm(String hhmm) {
		return hhmm != null && hhmm.length() >= 4 ? hhmm : DEFAULT_HM;
	}
}
