package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.DepRsltDto;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.PrcsGrdType;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SmltUtils;

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
	private final CastSmltService castSmltService; 
	private final CastDepMapper castDepMapper;

	@Override
	public Map<String, List<DepRsltDto>> retrieveDepGroupByTime(String smltId, String tmnlId) {
		Map<String, List<DepRsltDto>> result = new TreeMap<>();
		
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
		
		for (int h = 0; h < 24; h++) {
			String hour = String.format("%02d", h);
			String tm00 = hour + "00";
			result.put(tm00, aggregate.stream().filter(x -> x.getTime().equals(tm00)).collect(toList()));
			String tm30 = hour + "30";
			result.put(tm30, aggregate.stream().filter(x -> x.getTime().equals(tm30)).collect(toList()));
		}
		
		return result;
	}

	@Override
	public Map<String, List<DepRsltDto>> retrieveDepGroupByTimeUsingDate(String ymd, String tmnlId) {
		String smltId = castSmltService.retrieveRecentSmltId(ymd);
		return retrieveDepGroupByTime(smltId, tmnlId);
	}
}