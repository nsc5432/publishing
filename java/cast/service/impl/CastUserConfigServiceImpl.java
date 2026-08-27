package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.LinkedHashMap;
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
	// I 는 숫자 1 과 헷갈려 아일랜드 기호로 쓰지 않는다
	private static final List<String> ISLAND_CD_LIST =
			List.of("A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N");

	private final CastUserConfigMapper castUserConfigMapper;

	@Override
	public Map<String, List<UserConfigChknDto>> retrieveChknMapGroupByIsland(String ymd, String tmnlId) {
		List<ChknRawDto> chknList = castUserConfigMapper.retrieveChknList(ymd, tmnlId);
		Map<String, List<UserConfigChknDto>> result = new LinkedHashMap<>();

		for (String islandCd : ISLAND_CD_LIST) {
			List<ChknRawDto> islandChknList = chknList.stream()
					.filter(chkn -> islandCd.equals(chkn.getIsland()))
					.collect(toList());
			List<Integer> counterNumList = islandChknList.stream()
					.map(ChknRawDto::getCounterNum)
					.distinct()
					.sorted()
					.collect(toList());
			List<UserConfigChknDto> boothList = new ArrayList<>();

			// 한 카운터에 여러 배정 구간이 붙으므로 카운터 번호로 묶어 1건으로 접는다
			for (Integer counterNum : counterNumList) {
				List<ChknRawDto> counterChknList = islandChknList.stream()
						.filter(chkn -> chkn.getCounterNum() == counterNum)
						.collect(toList());
				boothList.add(new UserConfigChknDto().factory(counterChknList));
			}

			result.put(islandCd, boothList);
		}

		return result;
	}
}

