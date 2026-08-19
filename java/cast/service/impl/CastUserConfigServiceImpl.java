package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.ChknRawDto;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.mapper.CastUserConfigMapper;
import aoms.pm.cast.service.CastUserConfigService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastUserConfigServiceImpl.java
 * @Description : 사용자 설정 ServiceImpl
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
public class CastUserConfigServiceImpl implements CastUserConfigService {
	private final CastUserConfigMapper castUserConfigMapper;
	private static final List<String> IS_LANDS = List.of("A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N"); 

	@Override
	public Map<String, List<UserConfigChknDto>> retrieveChknMapGroupByIsland(String ymd, String tmnlId) {
		Map<String, List<UserConfigChknDto>> result = new HashMap<>();
		List<ChknRawDto> list = castUserConfigMapper.retrieveChknList(ymd, tmnlId);
		
		for (String island :IS_LANDS) {
			List<ChknRawDto> filteredIsland = list.stream().filter(x -> island.equals(x.getIsland())).collect(toList());
			List<Integer> counterNums = filteredIsland.stream().map(ChknRawDto::getCounterNum).distinct().sorted().collect(toList());
			List<UserConfigChknDto> subResultList = new ArrayList<>();
		
			for (Integer counterNum : counterNums) {
				List<ChknRawDto> filteredCounterNum = filteredIsland.stream().filter(x -> x.getCounterNum() == counterNum).collect(toList());
				subResultList.add(new UserConfigChknDto().factory(filteredCounterNum));
			}
			
			result.put(island, subResultList);
		}
		
		return result;
	}
}