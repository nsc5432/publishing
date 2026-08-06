package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.DepRsltDto;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.ScPlanDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserSmltDepDto;
import aoms.pm.cast.dto.UserSmltDepSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.PrcsGrdType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastDepServiceImpl.java
 * @Description : 출국장 ServiceImpl
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
public class CastDepServiceImpl implements CastDepService {
	private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("LGT"); // 출국장
	private static final String OPR_YN_Y = "Y";
	private static final String DEFAULT_HM = "0000";
	private static final String ZERO_MIN = "00";
	private static final int HOUR_PER_DAY = 24;
	private static final int PERCENT = 100;
	private static final int FIRST_PLAN_SN = 1;

	private final CastSmltService castSmltService;
	private final CastDepMapper castDepMapper;

	@Override
	public Map<String, List<DepRsltDto>> retrieveDepGroupByTime(String smltId, String tmnlId) {
		List<DepRsltDto> smltDepList = castDepMapper.retrieveSmltDepList(smltId, tmnlId);
		Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap = castSmltService.retrievePrcsGrdMap(PrcsGrdType.DEP);
		
		Map<String, List<DepRsltDto>> groupedByDomain = smltDepList.stream().collect(Collectors.groupingBy(x -> x.getDepNum()));
		List<DepRsltDto> aggregate = new ArrayList<>();
		
		groupedByDomain.forEach((depNum, list) -> {
			List<DepRsltDto> timeAggregated = SmltUtils.aggregate(list, 30, DepRsltDto::new);
			aggregate.addAll(timeAggregated.stream()
					.map(x -> x.withDepNum(depNum).withCgnStatus(SmltUtils.getCongestionStatus(prcsGrdMap, x.getWtngPsgCnt())))
					.collect(toList()));
		});
		
		return TimeBucketUtils.groupByBucket(aggregate);
	}

	@Override
	public Map<String, List<DepRsltDto>> retrieveDepGroupByTimeUsingDate(String ymd, String tmnlId) {
		String smltId = castSmltService.retrieveRecentSmltId(ymd);
		return retrieveDepGroupByTime(smltId, tmnlId);
	}

	@Override
	public UserSmltDepDto retrieveDepInfo(UserSmltDepSearchDto searchDto) {
		UserSmltDepDto result = new UserSmltDepDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(searchDto.getSmltId());

		List<DepFcltRawDto> fcltList = castDepMapper.retrieveDepFcltList(fcltTmnlId);
		Map<String, List<DepOperHrRawDto>> operHrMap = castDepMapper
				.retrieveDepOperHrList(fcltTmnlId, smltStng.getFcltyOpngTblDgRsrcId(), smltStng.getExcnYmd())
				.stream().collect(Collectors.groupingBy(DepOperHrRawDto::getDepNum));
		Map<String, Integer> scCntMap = castDepMapper
				.retrieveScCntList(fcltTmnlId, smltStng.getFcltyOpngTblScrtyCntrlRsrcId())
				.stream().collect(Collectors.toMap(ScCntRawDto::getDepNum, ScCntRawDto::getScCnt, (a, b) -> a));

		List<DepGateDto> depList = getGateDatas(fcltList, operHrMap, scCntMap);
		List<Integer> oprScCntList = getOprScCntList(depList);
		List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);

		SmltKpiDto kpi = castSmltService.retrieveSmltKpi(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
		kpi.setUtilRate(getUtilRate(depList));

		result.setTmnlId(tmnlId.getValue());
		result.setPeakScCnt(oprScCntList.stream().mapToInt(Integer::intValue).max().orElse(0));
		result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
		result.setDepList(depList);
		result.setWaitList(waitList);
		result.setKpi(kpi);

		return result;
	}

	private List<DepGateDto> getGateDatas(
			List<DepFcltRawDto> fcltList,
			Map<String, List<DepOperHrRawDto>> operHrMap,
			Map<String, Integer> scCntMap
	) {
		List<DepGateDto> result = new ArrayList<>();

		for (DepFcltRawDto fclt : fcltList) {
			String depNum = fclt.getDepNum();
			List<OprTimeDto> oprTimeList = toOprTimeList(operHrMap.getOrDefault(depNum, new ArrayList<>()));
			int scCnt = scCntMap.getOrDefault(depNum, 0);

			DepGateDto item = new DepGateDto();
			item.setDepNum(depNum);
			item.setDepNm(fclt.getDepNm());
			item.setOprYn(fclt.getUseYn());
			item.setScCnt(scCnt);
			// 일반/스마트패스 구분 컬럼이 없다 — 4단계에서 컬럼 신설 후 채운다
			item.setNormalCnt(0);
			item.setSmartPassCnt(0);
			item.setOprTimeList(oprTimeList);
			item.setPlanList(toPlanList(oprTimeList, scCnt));

			result.add(item);
		}

		return result;
	}

	private List<OprTimeDto> toOprTimeList(List<DepOperHrRawDto> operHrList) {
		return operHrList.stream()
				.map(x -> new OprTimeDto().withBgnHour(toBgnHour(x.getBgnHm())).withEndHour(toEndHour(x.getBgnHm(), x.getEndHm())))
				.sorted((a, b) -> a.getBgnHour() - b.getBgnHour())
				.collect(toList());
	}

	// 검색대 대수는 시간축이 없는 단일 값이다. 출국장 운영시간 전체를 덮는 구간 1개로 내려준다 (G7)
	private List<ScPlanDto> toPlanList(List<OprTimeDto> oprTimeList, int scCnt) {
		List<ScPlanDto> result = new ArrayList<>();

		if (oprTimeList.isEmpty()) {
			return result;
		}

		int bgnHour = oprTimeList.stream().mapToInt(OprTimeDto::getBgnHour).min().orElse(0);
		int endHour = oprTimeList.stream().mapToInt(OprTimeDto::getEndHour).max().orElse(0);

		result.add(new ScPlanDto().withPlanSn(FIRST_PLAN_SN).withScCnt(scCnt).withBgnHour(bgnHour).withEndHour(endHour));

		return result;
	}

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

	// 시간대별 검색대 대수 — 출국장 운영시간 구간을 시간축으로 펼쳐 계산한다 (G7)
	private List<Integer> getOprScCntList(List<DepGateDto> depList) {
		List<Integer> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			result.add(depList.stream().filter(x -> isOpr(x, hourValue)).mapToInt(DepGateDto::getScCnt).sum());
		}

		return result;
	}

	private boolean isOpr(DepGateDto gate, int hour) {
		return OPR_YN_Y.equals(gate.getOprYn())
				&& gate.getOprTimeList().stream().anyMatch(x -> x.getBgnHour() <= hour && hour < x.getEndHour());
	}

	// 가동률 = 운영 출국장·시간 합 / (전체 출국장 수 × 24시간)
	private int getUtilRate(List<DepGateDto> depList) {
		if (depList.isEmpty()) {
			return 0;
		}

		int oprGateHour = 0;

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			oprGateHour += (int) depList.stream().filter(x -> isOpr(x, hourValue)).count();
		}

		return oprGateHour * PERCENT / (depList.size() * HOUR_PER_DAY);
	}
}