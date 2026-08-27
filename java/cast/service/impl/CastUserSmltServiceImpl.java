package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.domains.MapLayout;
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
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.enums.SmltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.service.CastUserSmltService;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastUserSmltServiceImpl.java
 * @Description : 사용자 시뮬레이션 진입 · 지도 보기 · 수행 ServiceImpl — DB 조회
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

	private final CastSmltMapper castSmltMapper;
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
			// 사용자 시뮬레이션이 없으면 그날의 일일 시뮬레이션을 편집 기준으로 잡는다.
			// TN_PM_SMLT_STNG 신규 채번은 CAST 리소스 발행 순서가 확정되지 않아 보류했다 (D19)
			smltId = retrieveSmltId(searchDto.getYmd(), SmltType.DAILY, fcltTmnlId);
		}

		if (smltId == null) {
			result.error("해당 일자의 시뮬레이션 기준 정보가 없습니다.");
			return result;
		}

		SmltExcnDto lastFlfmt = castSmltMapper.retrieveLastSmltFlfmt(smltId);

		result.setSmltId(smltId);
		result.setSaveDt(nvl(castSmltMapper.retrieveUserSmltSaveDt(smltId, fcltTmnlId)));
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
		result.setIsland(nvl(searchDto.getIsland()));
		// 좌표 테이블이 확인되지 않아 배치 상수를 쓴다 (G1)
		result.setMarkerList(getMarkerList(tmnlId, fcltType, searchDto.getIsland()));

		return result;
	}

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

		searchDto.setFcltTmnlId(searchDto.getTmnlId().getFcltTmnlId());

		// 1. 저장된 조건 존재 확인
		if (castSmltMapper.retrieveUserSmltCondCnt(searchDto.getSmltId(), searchDto.getFcltTmnlId()) == 0) {
			result.error("저장된 조건이 없습니다. 조건을 먼저 저장해주세요.");
			return result;
		}

		// 2. 수행 이력 행 생성 (상태 RUNNING)
		int smltFlfmtSn = castSmltMapper.retrieveNextSmltFlfmtSn(searchDto.getSmltId());
		castSmltMapper.insertSmltFlfmtHstry(getFlfmtHstry(searchDto, smltFlfmtSn));

		// 3~4. CAST 리소스 발행 · 수행 시작 트리거 — 연동 DTO 부재로 보류 (G8 / D19)

		// 5. 시작 일시는 DB 의 CURRENT_TIMESTAMP 로 찍고 다시 읽어 온다
		SmltExcnDto flfmt = castSmltMapper.retrieveSmltFlfmtByKey(searchDto.getSmltId(), smltFlfmtSn);

		result.setSmltId(searchDto.getSmltId());
		result.setSmltFlfmtSn(smltFlfmtSn);
		result.setSmltFlfmtSttsCd(SmltExecStatus.RUNNING);
		result.setSmltFlfmtBgngDt(flfmt != null ? nvl(flfmt.getSmltFlfmtBgngDt()) : EMPTY);

		return result;
	}

	/* ================= 내부 ================= */

	// 같은 일자·터미널에 여러 건이면 가장 최근 것을 편집 대상으로 잡는다
	private String retrieveSmltId(String ymd, SmltType smltType, String fcltTmnlId) {
		SmltStngSearchDto stngSearchDto = new SmltStngSearchDto();
		stngSearchDto.setExcnYmd(ymd);
		stngSearchDto.setSmltType(smltType.getDbCode());

		return castSmltMapper.retrieveSmltStng(stngSearchDto).stream()
				.filter(x -> fcltTmnlId.equals(x.getTmnlId()))
				.map(SmltStngDto::getSmltId)
				.max(Comparator.naturalOrder())
				.orElse(null);
	}

	// 미수행이면 '' 다. 수행한 적이 있으면 마지막 이력의 상태를 그대로 쓴다
	private String toExecStatus(SmltExcnDto lastFlfmt) {
		if (lastFlfmt == null) {
			return EMPTY;
		}

		return SmltExecStatus.DONE.getValue().equals(lastFlfmt.getSmltFlfmtSttsCd())
				? SmltExecStatus.DONE.getValue()
				: SmltExecStatus.RUNNING.getValue();
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

	// 체크인 계열은 아일랜드, 출국장·검색대는 출국장 마커를 쓴다
	private List<MapMarkerDto> getMarkerList(TerminalKind tmnlId, FcltType fcltType, String island) {
		List<MapMarkerDto> result = new ArrayList<>();

		if (fcltType == FcltType.DEP || fcltType == FcltType.SC) {
			for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
				result.add(MapLayout.dptgtMarker(tmnlId, dptgtNo));
			}

			return result;
		}

		for (String islandCd : MapLayout.islandCdList(tmnlId)) {
			// 아일랜드를 지정해 열었으면 그 아일랜드만 표시한다
			if (island != null && !island.isEmpty() && !island.equals(islandCd)) {
				continue;
			}

			result.add(MapLayout.chknMarker(tmnlId, islandCd));
		}

		return result;
	}

	private String nvl(String value) {
		return value != null ? value : EMPTY;
	}
}
