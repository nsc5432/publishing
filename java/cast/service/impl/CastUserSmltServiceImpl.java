package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.domains.MapLayout;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SmltStngSearchDto;
import aoms.pm.cast.dto.UserSmltExecDto;
import aoms.pm.cast.dto.UserSmltExecSearchDto;
import aoms.pm.cast.dto.UserSmltFcltMapDto;
import aoms.pm.cast.dto.UserSmltFcltMapSearchDto;
import aoms.pm.cast.dto.UserSmltInfoDto;
import aoms.pm.cast.dto.UserSmltInfoSearchDto;
import aoms.pm.cast.dto.UserSmltReqDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.enums.SmltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.mapper.CastUserReqMapper;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastUserSmltService;
import aoms.pm.cast.service.CastUserSnapshotService;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastUserSmltServiceImpl.java
 * @Description : 사용자 시뮬레이션 진입 · 지도 보기 · 수행 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastUserSmltServiceImpl implements CastUserSmltService {
	private static final String EMPTY = "";
	// CAST 가 WhatIfRunID 로 읽어 간다. (SMLT_ID, TMNL_ID, SMLT_FLFMT_SN) 에서 결정론적으로 나온다
	private static final String REQ_ID_PREFIX = "WI";
	private static final int REQ_ID_SN_WIDTH = 4;

	private final CastSmltMapper castSmltMapper;
	private final CastUserReqMapper castUserReqMapper;
	private final CastSmltService castSmltService;
	private final CastUserSnapshotService castUserSnapshotService;
	private final SessionService sessionService;

	@Override
	public UserSmltInfoDto retrieveUserSmltInfo(UserSmltInfoSearchDto searchDto) {
		UserSmltInfoDto result = new UserSmltInfoDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		result.setYmd(searchDto.getYmd());
		result.setSaveDt(EMPTY);

		String smltId = retrieveSmltId(searchDto.getYmd(), SmltType.USER, fcltTmnlId);

		if (smltId == null) {
			// 사용자 시뮬레이션이 없으면 그날의 일일 시뮬레이션을 편집 기준으로 잡는다
			smltId = retrieveSmltId(searchDto.getYmd(), SmltType.DAILY, fcltTmnlId);
		}

		if (smltId == null) {
			result.error("해당 일자의 시뮬레이션 기준 정보가 없습니다.");
			return result;
		}

		SmltExcnDto lastFlfmt = castSmltMapper.retrieveSmltFlfmt(smltId, null);

		result.setSmltId(smltId);
		result.setSaveDt(emptyIfNull(castSmltMapper.retrieveUserSmltSaveDt(smltId, fcltTmnlId)));
		result.setSmltFlfmtSttsCd(toExecStatus(lastFlfmt));

		return result;
	}

	@Override
	public UserSmltFcltMapDto retrieveFcltMap(UserSmltFcltMapSearchDto searchDto) {
		UserSmltFcltMapDto result = new UserSmltFcltMapDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		FcltType fcltType = searchDto.getFcltType();

		result.setTmnlId(tmnlId.getValue());
		result.setFcltType(fcltType);
		result.setIsland(emptyIfNull(searchDto.getIsland()));
		// 좌표 테이블이 확인되지 않아 배치 상수를 쓴다 (G1)
		result.setMarkerList(getMarkerList(tmnlId, fcltType, searchDto.getIsland()));

		return result;
	}

	@Override
	public UserSmltExecDto executeUserSmlt(UserSmltExecSearchDto searchDto) {
		UserSmltExecDto result = new UserSmltExecDto();
		SessionUtils.setUserContext(searchDto, sessionService);

		JsonResponse validationError = validateExec(searchDto);

		if (validationError != null) {
			result.error(validationError.getErrorMessage());
			return result;
		}

		String smltId = searchDto.getSmltId();
		String fcltTmnlId = searchDto.getFcltTmnlId();
		String excnYmd = castSmltService.retrieveSmltStngByKey(smltId).getExcnYmd();

		int smltFlfmtSn = castSmltMapper.retrieveNextSmltFlfmtSn(smltId);
		String smltReqId = toSmltReqId(smltId, fcltTmnlId, smltFlfmtSn);

		try {
			UserSmltRsrcSnapshotDto snapshot =
					castUserSnapshotService.publish(smltId, searchDto.getTmnlId(), excnYmd);

			// 요청이 이력을 참조하므로 이력 먼저 넣는다
			castSmltMapper.insertSmltFlfmtHstry(getFlfmtHstry(searchDto, smltFlfmtSn));
			castUserReqMapper.insertUserReq(getUserReq(searchDto, smltReqId, smltFlfmtSn, excnYmd, snapshot));
		} catch (DuplicateKeyException exception) {
			// 사전 검사를 통과했어도 동시 클릭이면 UX_ACTIVE 나 이력 PK 에서 여기로 떨어진다.
			// 예외를 삼켜 화면에 메시지를 돌려주므로, 발행된 리소스는 직접 롤백을 걸어야 지워진다
			TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
			result.error("이미 수행 중인 시뮬레이션이 있습니다. 잠시 후 다시 시도해주세요.");
			return result;
		}

		// 시작 일시는 DB 의 CURRENT_TIMESTAMP 로 찍고 다시 읽어 온다
		SmltExcnDto flfmt = castSmltMapper.retrieveSmltFlfmt(smltId, smltFlfmtSn);

		result.setSmltId(smltId);
		result.setSmltReqId(smltReqId);
		result.setSmltFlfmtSn(smltFlfmtSn);
		result.setSmltFlfmtSttsCd(SmltExecStatus.RUNNING);
		result.setSmltFlfmtBgngDt(flfmt != null ? emptyIfNull(flfmt.getSmltFlfmtBgngDt()) : EMPTY);

		return result;
	}

	// 같은 일자·터미널에 여러 건이면 가장 최근 것을 편집 대상으로 잡는다
	private String retrieveSmltId(String ymd, SmltType smltType, String fcltTmnlId) {
		SmltStngSearchDto stngSearchDto = new SmltStngSearchDto();
		stngSearchDto.setExcnYmd(ymd);
		stngSearchDto.setSmltType(smltType.getDbCode());

		return castSmltMapper.retrieveSmltStng(stngSearchDto).stream()
				.filter(stng -> fcltTmnlId.equals(stng.getTmnlId()))
				.map(SmltStngDto::getSmltId)
				.max(Comparator.naturalOrder())
				.orElse(null);
	}

	// 미수행이면 '' 다. 수행한 적이 있으면 마지막 이력의 상태를 그대로 쓴다
	private String toExecStatus(SmltExcnDto lastFlfmt) {
		if (lastFlfmt == null) {
			return EMPTY;
		}

		for (SmltExecStatus status : SmltExecStatus.getList()) {
			if (status.getValue().equals(lastFlfmt.getSmltFlfmtSttsCd())) {
				return status.getValue();
			}
		}

		return SmltExecStatus.RUNNING.getValue();
	}

	// 체크인 계열은 아일랜드, 출국장·검색대는 출국장 마커를 쓴다
	private List<MapMarkerDto> getMarkerList(TerminalKind tmnlId, FcltType fcltType, String targetIslandCd) {
		List<MapMarkerDto> result = new ArrayList<>();

		if (fcltType == FcltType.DEP || fcltType == FcltType.SC) {
			for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
				result.add(MapLayout.dptgtMarker(tmnlId, dptgtNo));
			}

			return result;
		}

		for (String islandCd : MapLayout.islandCdList(tmnlId)) {
			// 아일랜드를 지정해 열었으면 그 아일랜드만 표시한다
			if (targetIslandCd != null && !targetIslandCd.isEmpty() && !targetIslandCd.equals(islandCd)) {
				continue;
			}

			result.add(MapLayout.chknMarker(tmnlId, islandCd));
		}

		return result;
	}

	// 통과하면 null
	private JsonResponse validateExec(UserSmltExecSearchDto searchDto) {
		if (searchDto.getLoginUserId() == null) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (searchDto.getSmltId() == null || searchDto.getSmltId().isEmpty() || searchDto.getTmnlId() == null) {
			return new JsonResponse().error("수행 대상 시뮬레이션이 지정되지 않았습니다.");
		}

		searchDto.setFcltTmnlId(searchDto.getTmnlId().getFcltTmnlId());

		// CAST 리소스는 세 영역이 다 있어야 완결된다. 하나라도 비면 실행하지 않는다
		if (castSmltMapper.retrieveUserSmltCondFilledCnt(searchDto.getSmltId(), searchDto.getFcltTmnlId()) == 0) {
			return new JsonResponse().error("운항·체크인카운터·출국장 조건을 모두 저장해주세요.");
		}

		if (castUserReqMapper.retrieveActiveReqCnt(searchDto.getSmltId(), searchDto.getFcltTmnlId()) > 0) {
			return new JsonResponse().error("이미 수행 중인 시뮬레이션이 있습니다.");
		}

		return null;
	}

	private String toSmltReqId(String smltId, String fcltTmnlId, int smltFlfmtSn) {
		return REQ_ID_PREFIX + smltId + fcltTmnlId
				+ String.format("%0" + REQ_ID_SN_WIDTH + "d", smltFlfmtSn);
	}

	private SmltExcnDto getFlfmtHstry(UserSmltExecSearchDto searchDto, int smltFlfmtSn) {
		SmltExcnDto result = new SmltExcnDto();
		SessionUtils.setUserContext(result, sessionService);

		result.setSmltId(searchDto.getSmltId());
		result.setSmltFlfmtSn(smltFlfmtSn);
		result.setTmnlId(searchDto.getFcltTmnlId());
		result.setSmltType(SmltType.USER.getDbCode());
		result.setSmltFlfmtSttsCd(SmltExecStatus.RUNNING.getValue());

		return result;
	}

	private UserSmltReqDto getUserReq(
			UserSmltExecSearchDto searchDto,
			String smltReqId,
			int smltFlfmtSn,
			String excnYmd,
			UserSmltRsrcSnapshotDto snapshot
	) {
		UserSmltReqDto result = new UserSmltReqDto();
		SessionUtils.setUserContext(result, sessionService);

		result.setSmltReqId(smltReqId);
		result.setSmltId(searchDto.getSmltId());
		result.setTmnlId(searchDto.getFcltTmnlId());
		result.setExcnYmd(excnYmd);
		result.setSmltFlfmtSn(smltFlfmtSn);

		result.setMdlRsrcId(snapshot.getMdlRsrcId());
		result.setFltSchdlRsrcId(snapshot.getFltSchdlRsrcId());
		result.setCknctAlctnRsrcId(snapshot.getCknctAlctnRsrcId());
		result.setSbdCntrlAlctnId(snapshot.getSbdCntrlAlctnId());
		result.setPrptStngRsrcId(snapshot.getPrptStngRsrcId());
		result.setFcltyOpngDptcnySrngRsrcId(snapshot.getFcltyOpngDptcnySrngRsrcId());
		result.setFcltyOpngDptcnyRsrcId(snapshot.getFcltyOpngDptcnyRsrcId());
		result.setFcltyOpngEntcnyRsrcId(snapshot.getFcltyOpngEntcnyRsrcId());
		result.setFcltyOpngScrtyCntrlRsrcId(snapshot.getFcltyOpngScrtyCntrlRsrcId());
		result.setFcltyOpngTrScrtyCntrlRsrcId(snapshot.getFcltyOpngTrScrtyCntrlRsrcId());
		result.setCknctSrvcHrRsrcId(snapshot.getCknctSrvcHrRsrcId());
		result.setChknTypeRsrcId(snapshot.getChknTypeRsrcId());
		result.setRptStngAtrbId(snapshot.getRptStngAtrbId());
		result.setSmltRsltSfx(smltReqId);

		return result;
	}

	private String emptyIfNull(String value) {
		return value != null ? value : EMPTY;
	}
}
