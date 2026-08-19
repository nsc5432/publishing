package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltKpiRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastSmltServiceImpl.java
 * @Description : Cast 시뮬레이션 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * 2026. 08. 09. / 노세찬 / 수행 이력 생성 로직을 CastUserSmltServiceImpl 로 이관, DB 모드 조건 부착
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 조회 계층이 공유하는 헬퍼다. Mock 모드에서는 등록되지 않는다
 * ({@link aoms.pm.cast.config.CastApiMode} 참고) — Mock 구현체는 이 서비스를 주입받지 않는다.
 */
@Service("castSmltService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastSmltServiceImpl implements CastSmltService {
	private static final int SEC_PER_MIN = 60; // _HR 컬럼(초) → 화면 표시 단위(분)

	private final CastSmltMapper castSmltMapper;

	@Override
	public SmltStngDto retrieveSmltStngByKey(String smltId) {
		SmltStngSearchDto stngSearchDto = new SmltStngSearchDto();
		stngSearchDto.setSmltId(smltId);
		return castSmltMapper.retrieveSmltStng(stngSearchDto).get(0);
	}
	
	@Override
	public List<WaitPsgDto> retrieveWaitPsgList(String smltId, String tmnlId, List<String> upPsgFcltCdList) {
		Map<Integer, WaitPsgDto> retrieved = castSmltMapper.retrieveWaitPsgList(smltId, tmnlId, upPsgFcltCdList)
				.stream().collect(Collectors.toMap(WaitPsgDto::getHour, Function.identity(), (first, ignored) -> first));

		List<WaitPsgDto> result = new ArrayList<>();

		// 결과가 없는 시간대(WTNG_PSG_CNT = 0)는 행이 없다. 24시간 축은 애플리케이션이 채운다
		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			WaitPsgDto item = retrieved.get(hourValue);
			result.add(item != null ? item : new WaitPsgDto().withHour(hourValue).withWaitPsgCnt(0));
		}

		return result;
	}

	@Override
	public SmltKpiDto retrieveSmltKpi(String smltId, String tmnlId, List<String> upPsgFcltCdList) {
		SmltKpiDto result = new SmltKpiDto();
		SmltKpiRawDto raw = castSmltMapper.retrieveSmltKpiRaw(smltId, tmnlId, upPsgFcltCdList);

		if (raw == null) {
			return result;
		}

		// _HR 컬럼은 초 단위다 (API_SPEC.md 5.2 대기시간(초)). 화면은 분으로 표시한다
		result.setAvgWaitMin(raw.getAvgWtngHr() / SEC_PER_MIN);
		result.setP95WaitMin(raw.getP95WtngHr() / SEC_PER_MIN);
		result.setMaxQueuePsgCnt(raw.getMaxWtngPsgCnt());

		return result;
	}
}
