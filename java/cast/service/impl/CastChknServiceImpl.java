package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.ChknRsltDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.dto.UserSmltChknDto;
import aoms.pm.cast.dto.UserSmltChknSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.CongestionType;
import aoms.pm.cast.enums.PrcsGrdType;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastUserConfigService;
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
public class CastChknServiceImpl implements CastChknService {
	private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("CC"); // 체크인카운터
	private static final List<String> BOOTH_USE_CRG_TYPE_CD_LIST = List.of("A", "B"); // 유인 체크인카운터
	private static final String CUSTOM_YN_N = "N";
	private static final int PERCENT = 100;

	private final CastSmltService castSmltService;
	private final CastSlfchknService castSlfchknService;
	private final CastUserConfigService castUserConfigService;
	private final CastChknMapper castChknMapper;

	@Override
	public Map<String, List<ChknRsltDto>> retrieveChknGroupByTime(String smltId, String tmnlId, String island) {
		String ymd = castSmltService.retrieveSmltStngByKey(smltId).getExcnYmd();
		
		List<ChknRsltDto> smltChknList = castChknMapper.retrieveSmltChknList(smltId, ymd, tmnlId, island);
		Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap = castSmltService.retrievePrcsGrdMap(PrcsGrdType.CHKN);
		
		Map<String, List<ChknRsltDto>> groupedByDomain = smltChknList.stream().collect(Collectors.groupingBy(x -> x.getAlnCd() + "|" + x.getCounterNum()));
		List<ChknRsltDto> aggregate = new ArrayList<>();
		
		groupedByDomain.forEach((key, list) -> {
			String[] parts = key.split("\\|");
			String alnCd = parts[0];
			int counterNum = Integer.parseInt(parts[1]);
			
			List<ChknRsltDto> timeAggregated = SmltUtils.aggregate(list, 30, ChknRsltDto::new);
			aggregate.addAll(timeAggregated.stream()
					.map(x -> x.withAlnCd(alnCd).withCounterNum(counterNum).withCgnStatus(SmltUtils.getCongestionStatus(prcsGrdMap, x.getWtngPsgCnt())))
					.collect(toList()));
		});
		
		return TimeBucketUtils.groupByBucket(aggregate);
	}

	@Override
	public Map<String, List<ChknRsltDto>> retrieveChknGroupByTimeUsingDate(String ymd, String tmnlId, String island) {
		String smltId = castSmltService.retrieveRecentSmltId(ymd);
		return retrieveChknGroupByTime(smltId, tmnlId, island);
	}

	@Override
	public List<SummaryRsltDto> retrieveChknXovisGroupByTime(String ymd, String tmnlId, String island) {
		return castSmltService.getXovisDatas(ymd, CongestionType.PEAK_CHKN, tmnlId, island, 60);
	}

	@Override
	public UserSmltChknDto retrieveChknCounterInfo(UserSmltChknSearchDto searchDto) {
		UserSmltChknDto result = new UserSmltChknDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		List<CknctCntRawDto> cknctCntList = castChknMapper.retrieveCknctCntList(fcltTmnlId, BOOTH_USE_CRG_TYPE_CD_LIST);
		Map<String, List<UserConfigChknDto>> boothMap = castUserConfigService.retrieveChknMapGroupByIsland(getExcnYmd(searchDto), fcltTmnlId);
		Map<String, List<SlfDeviceCntRawDto>> slfMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
				.stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

		List<String> islandCdList = cknctCntList.stream().map(CknctCntRawDto::getIsland).collect(toList());
		List<ChknIslandDto> islandList = getIslandDatas(islandCdList, boothMap, slfMap);
		List<Integer> oprBoothCntList = getOprBoothCntList(islandList);
		List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);

		int totCnt = cknctCntList.stream().mapToInt(CknctCntRawDto::getCknctCnt).sum();

		SmltKpiDto kpi = castSmltService.retrieveSmltKpi(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
		kpi.setUtilRate(getUtilRate(oprBoothCntList, totCnt));

		result.setTmnlId(tmnlId.getValue());
		result.setTotCnt(totCnt);
		result.setPeakCounterCnt(oprBoothCntList.stream().mapToInt(Integer::intValue).max().orElse(0));
		result.setTotKioskCnt(islandList.stream().mapToInt(ChknIslandDto::getKioskCnt).sum());
		result.setTotBagDropCnt(islandList.stream().mapToInt(ChknIslandDto::getBagDropCnt).sum());
		result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
		result.setIslandCdList(islandCdList);
		result.setAlnCdList(castChknMapper.retrieveAlnCdList(fcltTmnlId));
		result.setIslandList(islandList);
		result.setWaitList(waitList);
		result.setKpi(kpi);

		return result;
	}

	// 기준일자는 요청에 있으면 그대로, 없으면 시뮬레이션 설정의 실행일자를 쓴다
	private String getExcnYmd(UserSmltChknSearchDto searchDto) {
		String ymd = searchDto.getYmd();
		return ymd != null && !ymd.isEmpty() ? ymd : castSmltService.retrieveSmltStngByKey(searchDto.getSmltId()).getExcnYmd();
	}

	// 배정이 있는 아일랜드만 차트에 올린다. 배정이 없는 아일랜드는 islandCdList 로만 내려간다
	private List<ChknIslandDto> getIslandDatas(
			List<String> islandCdList,
			Map<String, List<UserConfigChknDto>> boothMap,
			Map<String, List<SlfDeviceCntRawDto>> slfMap
	) {
		List<ChknIslandDto> result = new ArrayList<>();

		for (String island : islandCdList) {
			List<UserConfigChknDto> booths = boothMap.getOrDefault(island, new ArrayList<>());

			if (booths.isEmpty()) {
				continue;
			}

			List<TimeRange> boothRanges = booths.stream().flatMap(x -> x.getTimeRanges().stream()).collect(toList());
			List<SlfDeviceCntRawDto> slfDevices = slfMap.getOrDefault(island, new ArrayList<>());

			ChknIslandDto item = new ChknIslandDto();
			item.setIsland(island);
			item.setBoothCnt(booths.size());
			item.setKioskCnt(getDeviceCnt(slfDevices, SlfType.KIOSK));
			item.setBagDropCnt(getDeviceCnt(slfDevices, SlfType.SBD));
			item.setOprTimeList(toOprTimeList(SmltUtils.mergeTimeRanges(boothRanges)));
			item.setBoothList(toBoothList(booths));

			result.add(item);
		}

		return result;
	}

	private List<ChknBoothDto> toBoothList(List<UserConfigChknDto> booths) {
		return booths.stream()
				.sorted((a, b) -> a.getCounterNum() - b.getCounterNum())
				.map(x -> new ChknBoothDto()
						.withBoothNo(x.getCounterNum())
						.withAlnCd(x.getAlnCd() != null ? x.getAlnCd() : "")
						.withCustomYn(CUSTOM_YN_N))
				.collect(toList());
	}

	private List<OprTimeDto> toOprTimeList(List<TimeRange> timeRanges) {
		return timeRanges.stream()
				.map(x -> new OprTimeDto().withBgnHour(x.getStart()).withEndHour(x.getEnd()))
				.collect(toList());
	}

	private int getDeviceCnt(List<SlfDeviceCntRawDto> slfDevices, SlfType slfType) {
		return slfDevices.stream().filter(x -> slfType == x.getSlfType()).mapToInt(SlfDeviceCntRawDto::getDeviceCnt).sum();
	}

	// 시간대별 운영 부스 수 — 아일랜드 운영시간 구간을 시간축으로 펼쳐 계산한다 (G7)
	private List<Integer> getOprBoothCntList(List<ChknIslandDto> islandList) {
		List<Integer> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			result.add(islandList.stream().filter(x -> isOpr(x.getOprTimeList(), hourValue)).mapToInt(ChknIslandDto::getBoothCnt).sum());
		}

		return result;
	}

	private boolean isOpr(List<OprTimeDto> oprTimeList, int hour) {
		return oprTimeList.stream().anyMatch(x -> x.getBgnHour() <= hour && hour < x.getEndHour());
	}

	// 가동률 = 운영 부스·시간 합 / (전체 카운터 수 × 24시간)
	private int getUtilRate(List<Integer> oprBoothCntList, int totCnt) {
		if (totCnt == 0) {
			return 0;
		}

		int oprBoothHour = oprBoothCntList.stream().mapToInt(Integer::intValue).sum();
		return oprBoothHour * PERCENT / (totCnt * oprBoothCntList.size());
	}
}