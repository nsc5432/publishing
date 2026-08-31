package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.DepHallLayout;
import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallGateDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.DepHallSlotDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.dto.MapNoticeDto;
import aoms.pm.cast.dto.MapNoticeItemDto;
import aoms.pm.cast.dto.MapUnitRsltDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.SmltRsltRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.mapper.CastMapMapper;
import aoms.pm.cast.service.CastDepHallService;
import aoms.pm.cast.service.CastOperHrService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastDepHallServiceImpl.java
 * @Description : 일일 시뮬레이션 결과 조회 - 출국장 ServiceImpl
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
public class CastDepHallServiceImpl implements CastDepHallService {
	/** 출국장 구역 시설 : 출국장(LGT) + 보안검색대(SC / SR) */
	private static final List<String> DPTGT_FCLT_CD_LIST = List.of("LGT", "SC", "SR");

	/** 아일랜드 마커 색을 맞추기 위한 체크인 구역 시설 */
	private static final List<String> CHKN_FCLT_CD_LIST = List.of("CC", "CK", "SBD");

	private static final String EMPTY = "";
	private static final String USE_YN_Y = "Y";
	private static final String USE_YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String DPTGT_NM_PREFIX = "출국장 ";
	private static final String FCLT_NM = "출국장";

	/** 타임라인 시작 시각 — 출국장은 04시 전에 열지 않는다 */
	private static final int SLOT_BGN_HOUR = 4;

	private static final int NOTICE_ITEM_LIMIT = 6; // 알림 목록이 도면을 덮지 않는 상한

	private final CastMapMapper castMapMapper;
	private final CastDepMapper castDepMapper;
	private final CastSmltService castSmltService;
	private final CastOperHrService castOperHrService;

	@Override
	public DepHallDto retrieveDepHall(DepHallSearchDto searchDto) {
		DepHallDto result = new DepHallDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		List<DepHallGateDto> gateList = getGateList(tmnlId, smltStng);
		List<MapMarkerDto> chknMarkerList = DepHallLayout.islandMarkerList(tmnlId);

		// 시각 → (묶음 단위 → 결과)
		Map<String, Map<String, SmltRsltRawDto>> dptgtDayMap = retrieveUnitRsltDayMap(searchDto, DPTGT_FCLT_CD_LIST);
		Map<String, Map<String, SmltRsltRawDto>> chknDayMap = retrieveUnitRsltDayMap(searchDto, CHKN_FCLT_CD_LIST);

		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(tmnlId.getValue());
		result.setGateList(gateList);
		result.setDptgtMarkerList(getDptgtMarkerList(tmnlId));
		result.setChknMarkerList(chknMarkerList);
		result.setGateMarkerList(DepHallLayout.gateMarkerList(tmnlId));
		result.setSlotList(getSlotList(gateList, chknMarkerList, dptgtDayMap, chknDayMap));

		return result;
	}

	/* ================= 결과 조회 ================= */

	private Map<String, Map<String, SmltRsltRawDto>> retrieveUnitRsltDayMap(
			DepHallSearchDto searchDto, List<String> upPsgFcltCdList) {
		return SmltUtils.foldByTimeAndUnitCd(castMapMapper.retrieveMapRsltDayList(
				searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), upPsgFcltCdList));
	}

	/* ================= 출국장 카드 ================= */

	// 카드는 자리 · 운영시간 · 부스 수만 갖는다 (혼잡도 · 지표는 슬롯이 채운다)
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
		result.setUseYn(USE_YN_Y.equals(useYn) ? USE_YN_Y : USE_YN_N);
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

	private List<MapMarkerDto> getDptgtMarkerList(TerminalKind tmnlId) {
		List<MapMarkerDto> result = new ArrayList<>();

		for (String dptgtNo : DepHallLayout.dptgtNoList(tmnlId)) {
			result.add(DepHallLayout.dptgtMarker(tmnlId, dptgtNo));
		}

		return result;
	}

	/* ================= 슬롯 ================= */

	private List<DepHallSlotDto> getSlotList(
			List<DepHallGateDto> gateList,
			List<MapMarkerDto> chknMarkerList,
			Map<String, Map<String, SmltRsltRawDto>> dptgtDayMap,
			Map<String, Map<String, SmltRsltRawDto>> chknDayMap) {
		List<DepHallSlotDto> result = new ArrayList<>();

		for (String hhmm : TimeBucketUtils.slotTimeList(SLOT_BGN_HOUR)) {
			List<MapUnitRsltDto> dptgtRsltList =
					getDptgtRsltList(gateList, dptgtDayMap.getOrDefault(hhmm, Map.of()));

			DepHallSlotDto slot = new DepHallSlotDto();
			slot.setHhmm(hhmm);
			slot.setNotice(getNotice(gateList, dptgtRsltList));
			slot.setDptgtRsltList(dptgtRsltList);
			slot.setChknRsltList(getChknRsltList(chknMarkerList, chknDayMap.getOrDefault(hhmm, Map.of())));

			result.add(slot);
		}

		return result;
	}

	private List<MapUnitRsltDto> getDptgtRsltList(List<DepHallGateDto> gateList, Map<String, SmltRsltRawDto> dptgtMap) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (DepHallGateDto gate : gateList) {
			result.add(toUnitRslt(gate.getDptgtNo(), dptgtMap.get(gate.getDptgtNo())));
		}

		return result;
	}

	/**
	 * 아일랜드 마커는 위치 참고용이지만 색(혼잡도)은 맞춰야 도면이 맵형태보기와 같게 보인다.
	 * 체크인 결과를 그대로 끌어온다.
	 */
	private List<MapUnitRsltDto> getChknRsltList(
			List<MapMarkerDto> chknMarkerList, Map<String, SmltRsltRawDto> chknMap) {
		List<MapUnitRsltDto> result = new ArrayList<>();

		for (MapMarkerDto marker : chknMarkerList) {
			result.add(toUnitRslt(marker.getLabel(), chknMap.get(marker.getLabel())));
		}

		return result;
	}

	private MapUnitRsltDto toUnitRslt(String unitCd, SmltRsltRawDto rslt) {
		MapUnitRsltDto result = new MapUnitRsltDto();

		result.setUnitCd(unitCd);
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(rslt != null ? rslt.getWtngPsgCnt() : 0));
		result.setStat(SmltUtils.toCgnStat(rslt));

		return result;
	}

	/* ================= 혼잡 알림 ================= */

	// 알림은 혼잡(BUSY) 이상인 출국장만, 혼잡한 순으로 보여준다
	private MapNoticeDto getNotice(List<DepHallGateDto> gateList, List<MapUnitRsltDto> dptgtRsltList) {
		Map<String, Integer> boothCntMap = gateList.stream()
				.collect(Collectors.toMap(DepHallGateDto::getDptgtNo, DepHallGateDto::getBoothCnt, (first, ignored) -> first));

		List<MapNoticeItemDto> itemList = new ArrayList<>();
		int maxWtngPsgCnt = 0;

		for (MapUnitRsltDto rslt : dptgtRsltList.stream()
				.sorted(Comparator.comparingInt((MapUnitRsltDto target) -> target.getStat().getWtngPsgCnt()).reversed())
				.collect(Collectors.toList())) {
			CongestionStatus cgnStatus = rslt.getCgnStatus();

			if (cgnStatus == CongestionStatus.FREE || cgnStatus == CongestionStatus.NORMAL) {
				continue;
			}

			maxWtngPsgCnt = Math.max(maxWtngPsgCnt, rslt.getStat().getWtngPsgCnt());

			if (itemList.size() < NOTICE_ITEM_LIMIT) {
				itemList.add(new MapNoticeItemDto()
						.withFcltNm(FCLT_NM)
						.withFcltCd(rslt.getUnitCd())
						.withBoothCnt(boothCntMap.getOrDefault(rslt.getUnitCd(), 0)));
			}
		}

		MapNoticeDto result = new MapNoticeDto();
		// 알림 단계는 가장 혼잡한 출국장을 따른다 (맵형태보기와 같은 기준)
		result.setCgnStatus(CongestionStatus.ofWtngPsgCnt(maxWtngPsgCnt));
		result.setItemList(itemList);

		return result;
	}

}
