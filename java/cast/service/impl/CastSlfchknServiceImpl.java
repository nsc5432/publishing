package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.PsgPrcsGrd;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SlfchknRsltDto;
import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.PrcsGrdType;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.mapper.CastSlfchknMapper;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastSlfchknServiceImpl.java
 * @Description : 셀프체크인/백드랍 ServiceImpl
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
public class CastSlfchknServiceImpl implements CastSlfchknService {
	private final CastSmltService castSmltService; 
	private final CastSlfchknMapper castSlfchknMapper;

	@Override
	public Map<String, List<SlfchknRsltDto>> retrieveSlfchknGroupByTime(String smltId, String tmnlId) {
		String ymd = castSmltService.retrieveSmltStngByKey(smltId).getExcnYmd();
		
		List<SlfchknRsltDto> smltSlfchknList = castSlfchknMapper.retrieveSmltSlfchknList(smltId, ymd, tmnlId);
		Map<CongestionStatus, PsgPrcsGrd> prcsGrdMap = castSmltService.retrievePrcsGrdMap(PrcsGrdType.SLFCHKN);
		
		Map<String, List<SlfchknRsltDto>> groupedByDomain = smltSlfchknList.stream().collect(Collectors.groupingBy(x -> x.getIsland() + "|" + x.getType().getValue()));
		List<SlfchknRsltDto> aggregate = new ArrayList<>();
		
		groupedByDomain.forEach((key, list) -> {
			String[] parts = key.split("\\|");
			String island = parts[0];
			SlfType slfType = SlfType.valueOf(parts[1]);
			
			List<SlfchknRsltDto> timeAggregated = SmltUtils.aggregate(list, 30, SlfchknRsltDto::new);
			aggregate.addAll(timeAggregated.stream()
					.map(x -> x.withIsland(island).withType(slfType).withCgnStatus(SmltUtils.getCongestionStatus(prcsGrdMap, x.getWtngPsgCnt())))
					.collect(toList()));
		});
		
		return TimeBucketUtils.groupByBucket(aggregate);
	}

	@Override
	public Map<String, List<SlfchknRsltDto>> retrieveSlfchknGroupByTimeUsingDate(String ymd, String tmnlId) {
		String smltId = castSmltService.retrieveRecentSmltId(ymd);
		return retrieveSlfchknGroupByTime(smltId, tmnlId);
	}

	@Override
	public List<SlfDeviceCntRawDto> retrieveSlfDeviceCntList(String tmnlId) {
		return castSlfchknMapper.retrieveSlfDeviceCntList(tmnlId);
	}
}