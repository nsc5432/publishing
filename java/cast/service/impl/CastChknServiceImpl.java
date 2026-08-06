package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.ChknRsltDto;
import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.CongestionType;
import aoms.pm.cast.enums.PrcsGrdType;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SmltUtils;

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
	private final CastSmltService castSmltService; 
	private final CastChknMapper castChknMapper;

	@Override
	public Map<String, List<ChknRsltDto>> retrieveChknGroupByTime(String smltId, String tmnlId, String island) {
		Map<String, List<ChknRsltDto>> result = new TreeMap<>();
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
	public Map<String, List<ChknRsltDto>> retrieveChknGroupByTimeUsingDate(String ymd, String tmnlId, String island) {
		String smltId = castSmltService.retrieveRecentSmltId(ymd);
		return retrieveChknGroupByTime(smltId, tmnlId, island);
	}

	@Override
	public List<SummaryRsltDto> retrieveChknXovisGroupByTime(String ymd, String tmnlId, String island) {
		return castSmltService.getXovisDatas(ymd, CongestionType.PEAK_CHKN, tmnlId, island, 60);
	}
}