package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltKpiRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
import aoms.pm.cast.dto.UserSmltExecDto;
import aoms.pm.cast.dto.UserSmltExecSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.service.CastRsrcService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SessionUtils;
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
 * 2026. 08. 08. / 노세찬 / executeUserSmlt 추가
 * 2026. 08. 08. / 노세찬 / 구 요약보기·맵형태보기 전용 집계 로직 삭제
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service("castSmltService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastSmltServiceImpl implements CastSmltService {
	private static final int SEC_PER_MIN = 60; // _HR 컬럼(초) → 화면 표시 단위(분)
	private static final String SMLT_TYPE_USER = "USER"; // 사용자 시뮬레이션. AUTO 는 일일 시뮬레이션

	private final CastSmltMapper castSmltMapper;
	private final CastRsrcService castRsrcService;
	private final SessionService sessionService;

	@Override
	public SmltStngDto retrieveSmltStngByKey(String smltId) {
		SmltStngSearchDto stngSearchDto = new SmltStngSearchDto();
		stngSearchDto.setSmltId(smltId);
		return castSmltMapper.retrieveSmltStng(stngSearchDto).get(0);
	}
	
	@Override
	public List<WaitPsgDto> retrieveWaitPsgList(String smltId, String tmnlId, List<String> upPsgFcltCdList) {
		Map<Integer, WaitPsgDto> retrieved = castSmltMapper.retrieveWaitPsgList(smltId, tmnlId, upPsgFcltCdList)
				.stream().collect(Collectors.toMap(WaitPsgDto::getHour, Function.identity(), (a, b) -> a));

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

	/*
	 * 수행 시작 — 비동기다. 동기적으로 완료를 기다리지 않는다.
	 * 진행 상황은 모니터링 화면(retrieveSmltExecSmry / retrieveSmltExecList)이 폴링한다.
	 *
	 *   1. smltId + tmnlId 로 저장된 조건 존재 확인
	 *   2. 수행 이력 행 생성 (TH_PM_SMLT_EXCN_HSTRY, 상태 RUNNING)
	 *   3. CAST 리소스 발행
	 *   4. 수행 시작 트리거
	 *   5. execSn / execStatus / bgnDt 반환
	 *
	 * 3·4 는 aoms.pm.cmmn.dto.* 부재(G8)로 아직 비어 있다. 호출 지점만 확보한 상태다.
	 */
	@Override
	public UserSmltExecDto executeUserSmlt(UserSmltExecSearchDto searchDto) {
		UserSmltExecDto result = new UserSmltExecDto();
		SessionUtils.setUserContext(searchDto, sessionService);

		if (searchDto.getLoginUserId() == null) {
			result.error("로그인을 진행해주세요.");
			return result;
		}

		if (searchDto.getSmltId() == null || searchDto.getSmltId().isEmpty() || searchDto.getTmnlId() == null) {
			result.error("수행 대상 시뮬레이션이 지정되지 않았습니다.");
			return result;
		}

		String smltId = searchDto.getSmltId();
		String fcltTmnlId = searchDto.getTmnlId().getFcltTmnlId();
		searchDto.setFcltTmnlId(fcltTmnlId);

		if (castSmltMapper.retrieveUserSmltCondCnt(smltId, fcltTmnlId) == 0) {
			result.error("저장된 조건이 없습니다. 조건을 먼저 저장해주세요.");
			return result;
		}

		int smltExcnSn = castSmltMapper.retrieveNextSmltExcnSn(smltId);
		castSmltMapper.insertSmltExcnHstry(getExcnHstry(searchDto, smltExcnSn));

		castRsrcService.publishUserSmltRsrc(smltId, fcltTmnlId);
		castRsrcService.triggerUserSmltExcn(smltId, fcltTmnlId, smltExcnSn);

		SmltExcnDto saved = castSmltMapper.retrieveSmltExcnByKey(smltId, smltExcnSn);

		result.setSmltId(smltId);
		result.setExecSn(smltExcnSn);
		result.setExecStatus(SmltExecStatus.RUNNING);
		result.setBgnDt(saved != null ? saved.getBgnDt() : "");

		return result;
	}

	// 시작 일시는 DB 의 CURRENT_TIMESTAMP 로 찍고 다시 읽어 온다
	private SmltExcnDto getExcnHstry(UserSmltExecSearchDto searchDto, int smltExcnSn) {
		SmltExcnDto result = new SmltExcnDto();
		SessionUtils.setUserContext(result, sessionService);

		result.setSmltId(searchDto.getSmltId());
		result.setSmltExcnSn(smltExcnSn);
		result.setTmnlId(searchDto.getFcltTmnlId());
		result.setSmltType(SMLT_TYPE_USER);
		result.setSmltExcnSttsCd(SmltExecStatus.RUNNING.getValue());

		return result;
	}
}
