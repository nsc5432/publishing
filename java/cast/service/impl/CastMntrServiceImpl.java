package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.MntrSearchDto;
import aoms.pm.cast.dto.SmltCastExecDto;
import aoms.pm.cast.dto.SmltExcnCntRawDto;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltExecDetailDto;
import aoms.pm.cast.dto.SmltExecListDto;
import aoms.pm.cast.dto.SmltExecSmryDto;
import aoms.pm.cast.enums.SmltExecStatus;
import aoms.pm.cast.enums.SmltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastSmltMapper;
import aoms.pm.cast.service.CastMntrService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastMntrServiceImpl.java
 * @Description : 시뮬레이션 모니터링 ServiceImpl
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
public class CastMntrServiceImpl implements CastMntrService {
	private static final String EMPTY = "";
	private static final String TMNL_ID_P03 = "P03"; // 제2여객터미널
	private static final int SEC_PER_MIN = 60;

	private final CastSmltMapper castSmltMapper;

	@Override
	public SmltExecSmryDto retrieveSmltExecSmry(MntrSearchDto searchDto) {
		SmltExecSmryDto result = new SmltExecSmryDto();
		SmltExcnCntRawDto raw = castSmltMapper.retrieveSmltFlfmtSmry(searchDto.getBgnDt(), searchDto.getEndDt());

		if (raw == null) {
			return result;
		}

		result.setTotCnt(raw.getTotCnt());
		result.setDoneCnt(raw.getDoneCnt());
		result.setRunningCnt(raw.getRunningCnt());
		result.setAvgExecMin(raw.getAvgExecSec() / SEC_PER_MIN);
		result.setAvgExecSec(raw.getAvgExecSec() % SEC_PER_MIN);

		return result;
	}

	@Override
	public SmltExecListDto retrieveSmltExecList(MntrSearchDto searchDto) {
		SmltExecListDto result = new SmltExecListDto();
		List<SmltCastExecDto> stdList = new ArrayList<>();
		List<SmltCastExecDto> userList = new ArrayList<>();

		// 표준/사용자를 좌우로 나란히 보여주므로 한 번 읽어 화면 기준으로 나눈다.
		// 목록 No 는 각 표에서 1부터 다시 매긴다 — 매퍼의 ROW_NUM 은 전체 기준이라 쓸 수 없다
		for (SmltExcnDto flfmt : castSmltMapper.retrieveSmltFlfmtList(searchDto.getBgnDt(), searchDto.getEndDt())) {
			SmltType smltType = SmltType.ofDbCode(flfmt.getSmltType());
			List<SmltCastExecDto> targetList = smltType == SmltType.USER ? userList : stdList;

			targetList.add(toExecDto(flfmt, smltType, targetList.size() + 1));
		}

		result.setStdList(stdList);
		result.setUserList(userList);

		return result;
	}

	@Override
	public SmltExecDetailDto retrieveSmltExecDetail(MntrSearchDto searchDto) {
		SmltExecDetailDto result = new SmltExecDetailDto();
		SmltExcnDto flfmt = castSmltMapper.retrieveSmltFlfmt(searchDto.getSmltId(), null);

		if (flfmt == null) {
			result.error("수행 이력을 찾을 수 없습니다.");
			return result;
		}

		result.setSmltId(flfmt.getSmltId());
		result.setSmltType(SmltType.ofDbCode(flfmt.getSmltType()));
		result.setYmd(emptyIfNull(flfmt.getExcnYmd()));
		result.setTmnlId(toTerminalKind(flfmt.getTmnlId()).getValue());
		result.setDeptNm(emptyIfNull(flfmt.getDeptNm()));
		result.setUserNm(emptyIfNull(flfmt.getUserNm()));
		result.setSmltFlfmtBgngDt(emptyIfNull(flfmt.getSmltFlfmtBgngDt()));
		result.setSmltFlfmtEndDt(emptyIfNull(flfmt.getSmltFlfmtEndDt()));
		result.setExecMin(flfmt.getExecMin());
		result.setSmltFlfmtSttsCd(toExecStatus(flfmt.getSmltFlfmtSttsCd()));

		return result;
	}

	private SmltCastExecDto toExecDto(SmltExcnDto flfmt, SmltType smltType, int rowNum) {
		SmltCastExecDto result = new SmltCastExecDto();

		result.setRowNum(rowNum);
		result.setSmltId(flfmt.getSmltId());
		result.setSmltType(smltType);
		result.setRgtrId(emptyIfNull(flfmt.getRgtrId()));
		result.setDeptNm(emptyIfNull(flfmt.getDeptNm()));
		result.setUserNm(emptyIfNull(flfmt.getUserNm()));
		result.setSmltFlfmtBgngDt(emptyIfNull(flfmt.getSmltFlfmtBgngDt()));
		result.setSmltFlfmtEndDt(emptyIfNull(flfmt.getSmltFlfmtEndDt()));
		result.setExecMin(flfmt.getExecMin());
		result.setSmltFlfmtSttsCd(toExecStatus(flfmt.getSmltFlfmtSttsCd()));

		return result;
	}

	private SmltExecStatus toExecStatus(String smltFlfmtSttsCd) {
		return SmltExecStatus.DONE.getValue().equals(smltFlfmtSttsCd) ? SmltExecStatus.DONE : SmltExecStatus.RUNNING;
	}

	// DB 는 P01/P02/P03, 화면은 T1/T2 다. 탑승동(P02)은 T1 에 붙는다
	private TerminalKind toTerminalKind(String tmnlId) {
		return TMNL_ID_P03.equals(tmnlId) ? TerminalKind.T2 : TerminalKind.T1;
	}

	private String emptyIfNull(String value) {
		return value != null ? value : EMPTY;
	}
}
