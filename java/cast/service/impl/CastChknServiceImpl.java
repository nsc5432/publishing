package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserChknBoothRawDto;
import aoms.pm.cast.dto.UserChknOperHrRawDto;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.dto.UserSmltChknDto;
import aoms.pm.cast.dto.UserSmltChknSaveDto;
import aoms.pm.cast.dto.UserSmltChknSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastUserConfigService;
import aoms.pm.utils.SessionUtils;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastChknServiceImpl.java
 * @Description : 체크인카운터 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastChknServiceImpl implements CastChknService {
	private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("CC"); // 체크인카운터
	private static final List<String> BOOTH_USE_CRG_TYPE_CD_LIST = List.of("A", "B"); // 유인 체크인카운터
	private static final String CUSTOM_YN_Y = "Y";
	private static final String CUSTOM_YN_N = "N";
	private static final String EMPTY_ALN_CD = "";
	private static final int PERCENT = 100;
	/** 아일랜드 한 면(L 또는 R)의 부스 수 — 화면 도크의 좌/우 스트립 한 줄 길이다 */
	private static final int SIDE_BOOTHS = 18;
	/** 아일랜드 1개의 부스 골격 크기 (좌 18 + 우 18) */
	private static final int ISLAND_BOOTHS = SIDE_BOOTHS * 2;

	private final CastSmltService castSmltService;
	private final CastSlfchknService castSlfchknService;
	private final CastUserConfigService castUserConfigService;
	private final CastChknMapper castChknMapper;
	private final SessionService sessionService;

	@Override
	public UserSmltChknDto retrieveChknCounterInfo(UserSmltChknSearchDto searchDto) {
		UserSmltChknDto result = new UserSmltChknDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String excnYmd = getExcnYmd(searchDto);

		List<CknctCntRawDto> cknctCntList = castChknMapper.retrieveCknctCntList(fcltTmnlId, BOOTH_USE_CRG_TYPE_CD_LIST);
		List<String> islandCdList = cknctCntList.stream().map(CknctCntRawDto::getIsland).collect(toList());
		List<ChknIslandDto> islandList = getIslandList(searchDto, excnYmd, fcltTmnlId, islandCdList);
		List<Integer> hourlyOprBoothCntList = getHourlyOprBoothCntList(islandList);
		List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
		int totCnt = cknctCntList.stream().mapToInt(CknctCntRawDto::getCknctCnt).sum();

		SmltKpiDto kpi = castSmltService.retrieveSmltKpi(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
		kpi.setUtilRate(getUtilRate(hourlyOprBoothCntList, totCnt));

		result.setTmnlId(tmnlId.getValue());
		result.setTotCnt(totCnt);
		result.setPeakCounterCnt(hourlyOprBoothCntList.stream().mapToInt(Integer::intValue).max().orElse(0));
		result.setTotKioskCnt(islandList.stream().mapToInt(ChknIslandDto::getKioskCnt).sum());
		result.setTotBagDropCnt(islandList.stream().mapToInt(ChknIslandDto::getBagDropCnt).sum());
		result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
		result.setIslandCdList(islandCdList);
		result.setAlnCdList(castChknMapper.retrieveAlnCdList(excnYmd, fcltTmnlId));
		result.setIslandList(islandList);
		result.setWaitList(waitList);
		result.setKpi(kpi);

		return result;
	}

	/*
	 * 저장 전략 — 전체 교체(delete-then-insert).
	 * 화면이 터미널 1개분 아일랜드 전체를 보내므로 부분 수정이 아니라 묶음 교체다.
	 * 삭제 범위는 SMLT_ID + TMNL_ID 이며, TMNL_ID 를 빼면 T1 저장이 T2 를 지운다.
	 * 감사 컬럼 등록자는 사용자 조작이므로 #{loginUserId} 다 ('CAST' 가 아니다).
	 */
	@Override
	public JsonResponse saveChknCounterInfo(UserSmltChknSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		JsonResponse validationError = validate(saveDto);

		if (validationError != null) {
			return validationError;
		}

		saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());
		saveDto.setIslandList(normalizeIslandList(saveDto.getIslandList()));

		// 자식부터 지운다
		castChknMapper.deleteUserChknBoothList(saveDto);
		castChknMapper.deleteUserChknOperHrList(saveDto);
		castChknMapper.deleteUserChknIslandList(saveDto);

		if (saveDto.getIslandList().isEmpty()) {
			return new JsonResponse();
		}

		castChknMapper.insertUserChknIslandList(saveDto);

		// INSERT ALL 은 INTO 절이 0개면 문법 오류다. 비어 있으면 호출하지 않는다
		if (saveDto.getIslandList().stream().anyMatch(island -> !island.getOprTimeList().isEmpty())) {
			castChknMapper.insertUserChknOperHrList(saveDto);
		}

		if (saveDto.getIslandList().stream().anyMatch(island -> !island.getBoothList().isEmpty())) {
			castChknMapper.insertUserChknBoothList(saveDto);
		}

		return new JsonResponse();
	}

	private String getExcnYmd(UserSmltChknSearchDto searchDto) {
		String ymd = searchDto.getYmd();

		return ymd != null && !ymd.isEmpty()
				? ymd
				: castSmltService.retrieveSmltStngByKey(searchDto.getSmltId()).getExcnYmd();
	}

	/*
	 * 화면 초기값의 출처는 둘이다.
	 *   1. 사용자가 저장한 적이 있으면 그 값 (TN_PM_SMLT_USER_CHKN_*)
	 *   2. 없으면 그날의 배정정보 (TI_GO_CKNCT_DALY_ALOT)
	 * 저장분이 있으면 배정정보는 읽지 않는다 — 사용자가 지운 아일랜드가 되살아나면 안 된다.
	 */
	private List<ChknIslandDto> getIslandList(
			UserSmltChknSearchDto searchDto,
			String excnYmd,
			String fcltTmnlId,
			List<String> islandCdList
	) {
		List<ChknIslandDto> savedIslandList = getSavedIslandList(searchDto.getSmltId(), fcltTmnlId);

		if (!savedIslandList.isEmpty()) {
			return savedIslandList;
		}

		Map<String, List<UserConfigChknDto>> allotBoothMap =
				castUserConfigService.retrieveChknMapGroupByIsland(excnYmd, fcltTmnlId);
		Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
				.stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

		return getAllotIslandList(islandCdList, allotBoothMap, slfDeviceMap);
	}

	private List<ChknIslandDto> getSavedIslandList(String smltId, String fcltTmnlId) {
		List<ChknIslandDto> result = castChknMapper.retrieveUserChknIslandList(smltId, fcltTmnlId);

		if (result.isEmpty()) {
			return result;
		}

		Map<String, List<UserChknOperHrRawDto>> operHrMap = castChknMapper.retrieveUserChknOperHrList(smltId, fcltTmnlId)
				.stream().collect(Collectors.groupingBy(UserChknOperHrRawDto::getIsland));
		Map<String, List<UserChknBoothRawDto>> boothMap = castChknMapper.retrieveUserChknBoothList(smltId, fcltTmnlId)
				.stream().collect(Collectors.groupingBy(UserChknBoothRawDto::getIsland));

		for (ChknIslandDto island : result) {
			List<UserChknBoothRawDto> savedBoothList = boothMap.getOrDefault(island.getIsland(), new ArrayList<>());
			Map<Integer, String> alnCdMap = new LinkedHashMap<>();
			Map<Integer, String> customYnMap = new LinkedHashMap<>();

			for (UserChknBoothRawDto booth : savedBoothList) {
				alnCdMap.put(booth.getBoothNo(), emptyIfNull(booth.getAlnCd()));
				customYnMap.put(booth.getBoothNo(), toCustomYn(booth.getCstmAltmntYn()));
			}

			island.setOprTimeList(operHrMap.getOrDefault(island.getIsland(), new ArrayList<>()).stream()
					.map(operHr -> new OprTimeDto()
							.withOperBgngHour(operHr.getOperBgngHour())
							.withOperEndHour(operHr.getOperEndHour()))
					.collect(toList()));
			island.setBoothList(toBoothList(alnCdMap, customYnMap));
		}

		return result;
	}

	// 배정이 있는 아일랜드만 차트에 올린다. 배정이 없는 아일랜드는 islandCdList 로만 내려간다
	private List<ChknIslandDto> getAllotIslandList(
			List<String> islandCdList,
			Map<String, List<UserConfigChknDto>> allotBoothMap,
			Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap
	) {
		List<ChknIslandDto> result = new ArrayList<>();

		for (String islandCd : islandCdList) {
			List<UserConfigChknDto> allotBoothList = allotBoothMap.getOrDefault(islandCd, new ArrayList<>());

			if (allotBoothList.isEmpty()) {
				continue;
			}

			List<TimeRange> boothTimeRangeList = allotBoothList.stream()
					.flatMap(booth -> booth.getTimeRanges().stream())
					.collect(toList());
			List<SlfDeviceCntRawDto> slfDeviceList = slfDeviceMap.getOrDefault(islandCd, new ArrayList<>());
			Map<Integer, String> alnCdMap = toAlnCdMap(allotBoothList);

			ChknIslandDto island = new ChknIslandDto();
			island.setIsland(islandCd);
			// BOOTH_CNT 는 골격 크기가 아니라 "배정된 부스 수"다 — 피크 카운터·가동률이 이 값을 쓴다
			island.setBoothCnt(alnCdMap.size());
			island.setKioskCnt(getDeviceCnt(slfDeviceList, SlfType.KIOSK));
			island.setBagDropCnt(getDeviceCnt(slfDeviceList, SlfType.SBD));
			island.setOprTimeList(toOprTimeList(SmltUtils.mergeTimeRanges(boothTimeRangeList)));
			island.setBoothList(toBoothList(alnCdMap, new LinkedHashMap<>()));

			result.add(island);
		}

		return result;
	}

	private Map<Integer, String> toAlnCdMap(List<UserConfigChknDto> allotBoothList) {
		Map<Integer, String> result = new LinkedHashMap<>();

		allotBoothList.stream()
				.sorted(Comparator.comparingInt(UserConfigChknDto::getCounterNum))
				.forEach(booth -> result.put(booth.getCounterNum(), emptyIfNull(booth.getAlnCd())));

		return result;
	}

	/*
	 * 부스 목록은 배정된 자리만이 아니라 아일랜드 36석 골격 전체다.
	 * 화면 도크가 좌 18 / 우 18 스트립을 boothList 그대로 그리므로, 미배정 자리가 빠지면
	 * 그 좌석을 편집할 방법이 없고 한쪽 번호대만 배정된 아일랜드가 반쪽 블럭으로 잘못 그려진다.
	 * 면(L/R) 구분 필드는 원천에 없다 — 화면이 부스 번호로 파생한다 (1~18 좌 / 19~36 우).
	 */
	private List<ChknBoothDto> toBoothList(Map<Integer, String> alnCdMap, Map<Integer, String> customYnMap) {
		List<ChknBoothDto> result = new ArrayList<>();
		// 36 을 넘는 번호를 쓰는 아일랜드가 있으면 골격을 늘린다 — 배정을 잘라 버리지 않기 위함
		int maxBoothNo = alnCdMap.keySet().stream().mapToInt(Integer::intValue).max().orElse(0);

		for (int boothNo = 1; boothNo <= Math.max(ISLAND_BOOTHS, maxBoothNo); boothNo++) {
			result.add(new ChknBoothDto()
					.withBoothNo(boothNo)
					.withAlnCd(alnCdMap.getOrDefault(boothNo, EMPTY_ALN_CD))
					.withCstmAltmntYn(customYnMap.getOrDefault(boothNo, CUSTOM_YN_N)));
		}

		return result;
	}

	private List<OprTimeDto> toOprTimeList(List<TimeRange> timeRangeList) {
		return timeRangeList.stream()
				.map(range -> new OprTimeDto().withOperBgngHour(range.getStart()).withOperEndHour(range.getEnd()))
				.collect(toList());
	}

	private int getDeviceCnt(List<SlfDeviceCntRawDto> slfDeviceList, SlfType slfType) {
		return slfDeviceList.stream()
				.filter(device -> slfType == device.getSlfType())
				.mapToInt(SlfDeviceCntRawDto::getDeviceCnt)
				.sum();
	}

	// 시간대별 운영 부스 수 — 아일랜드 운영시간 구간을 시간축으로 펼쳐 계산한다 (G7)
	private List<Integer> getHourlyOprBoothCntList(List<ChknIslandDto> islandList) {
		List<Integer> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			result.add(islandList.stream()
					.filter(island -> isOpr(island.getOprTimeList(), hourValue))
					.mapToInt(ChknIslandDto::getBoothCnt)
					.sum());
		}

		return result;
	}

	private boolean isOpr(List<OprTimeDto> oprTimeList, int hour) {
		return oprTimeList.stream()
				.anyMatch(oprTime -> oprTime.getOperBgngHour() <= hour && hour < oprTime.getOperEndHour());
	}

	// 가동률 = 운영 부스·시간 합 / (전체 카운터 수 × 24시간)
	private int getUtilRate(List<Integer> hourlyOprBoothCntList, int totCnt) {
		if (totCnt == 0) {
			return 0;
		}

		int oprBoothHour = hourlyOprBoothCntList.stream().mapToInt(Integer::intValue).sum();

		return oprBoothHour * PERCENT / (totCnt * hourlyOprBoothCntList.size());
	}

	// 통과하면 null
	private JsonResponse validate(UserSmltChknSaveDto saveDto) {
		if (saveDto.getLoginUserId() == null) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (saveDto.getSmltId() == null || saveDto.getSmltId().isEmpty() || saveDto.getTmnlId() == null) {
			return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
		}

		return null;
	}

	// null 을 그대로 바인딩하면 Oracle 이 JdbcType 을 못 정한다. 빈 목록·기본값으로 채워 넘긴다
	private List<ChknIslandDto> normalizeIslandList(List<ChknIslandDto> islandList) {
		if (islandList == null) {
			return new ArrayList<>();
		}

		List<ChknIslandDto> result = islandList.stream()
				.filter(island -> island.getIsland() != null && !island.getIsland().isEmpty())
				.collect(toList());

		for (ChknIslandDto island : result) {
			island.setOprTimeList(island.getOprTimeList() != null ? island.getOprTimeList() : new ArrayList<>());
			island.setBoothList(normalizeBoothList(island.getBoothList()));
			// 부스 수는 화면 계산식과 같게 배정 목록 길이를 쓴다 (DELTA 2.1)
			island.setBoothCnt(island.getBoothList().size());
		}

		return result;
	}

	/*
	 * 화면은 아일랜드 36석 골격을 통째로 보낸다. 골격은 표현이지 데이터가 아니므로
	 * 배정이 있는 자리만 저장한다 — 미배정 자리까지 넣으면 터미널 1개 저장이 468행이 되어
	 * INSERT ALL 한 문장이 지나치게 길어진다. 조회할 때 다시 36석으로 펴진다 (toBoothList).
	 */
	private List<ChknBoothDto> normalizeBoothList(List<ChknBoothDto> boothList) {
		if (boothList == null) {
			return new ArrayList<>();
		}

		List<ChknBoothDto> result = boothList.stream()
				.filter(booth -> booth.getAlnCd() != null && !booth.getAlnCd().isEmpty())
				.collect(toList());

		for (ChknBoothDto booth : result) {
			booth.setCstmAltmntYn(toCustomYn(booth.getCstmAltmntYn()));
		}

		return result;
	}

	private String emptyIfNull(String value) {
		return value != null ? value : EMPTY_ALN_CD;
	}

	private String toCustomYn(String value) {
		return CUSTOM_YN_Y.equals(value) ? CUSTOM_YN_Y : CUSTOM_YN_N;
	}
}
