package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.MntrSearchDto;
import aoms.pm.cast.dto.SmltExcnCntRawDto;
import aoms.pm.cast.dto.SmltExcnDto;
import aoms.pm.cast.dto.SmltExecDetailDto;
import aoms.pm.cast.dto.SmltCastExecDto;
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
 * @Description : 시뮬레이션 모니터링 ServiceImpl — DB 조회
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
 *
 * 부서/성명은 사용자 테이블이 확인되지 않아(G1) 매퍼가 '' 를 내려준다.
 * 조인 키가 될 등록자 ID 는 {@code rgtrId} 로 함께 실린다.
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
		SmltExcnCntRawDto raw = castSmltMapper.retrieveSmltExcnSmry(searchDto.getBgnDt(), searchDto.getEndDt());

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
		for (SmltExcnDto excn : castSmltMapper.retrieveSmltExcnList(searchDto.getBgnDt(), searchDto.getEndDt())) {
			SmltType smltType = SmltType.ofDbCode(excn.getSmltType());
			List<SmltCastExecDto> target = smltType == SmltType.USER ? userList : stdList;

			target.add(toExecDto(excn, smltType, target.size() + 1));
		}

		result.setStdList(stdList);
		result.setUserList(userList);

		return result;
	}

	@Override
	public SmltExecDetailDto retrieveSmltExecDetail(MntrSearchDto searchDto) {
		SmltExecDetailDto result = new SmltExecDetailDto();
		SmltExcnDto excn = castSmltMapper.retrieveSmltExcnDetail(searchDto.getSmltId());

		if (excn == null) {
			result.error("수행 이력을 찾을 수 없습니다.");
			return result;
		}

		result.setSmltId(excn.getSmltId());
		result.setSmltType(SmltType.ofDbCode(excn.getSmltType()));
		result.setYmd(nvl(excn.getExcnYmd()));
		result.setTmnlId(toTerminalKind(excn.getTmnlId()).getValue());
		result.setDeptNm(nvl(excn.getDeptNm()));
		result.setUserNm(nvl(excn.getUserNm()));
		result.setBgnDt(nvl(excn.getBgnDt()));
		result.setEndDt(nvl(excn.getEndDt()));
		result.setExecMin(excn.getExecMin());
		result.setExecStatus(toExecStatus(excn.getSmltExcnSttsCd()));

		return result;
	}

	private SmltCastExecDto toExecDto(SmltExcnDto excn, SmltType smltType, int rowNum) {
		SmltCastExecDto result = new SmltCastExecDto();

		result.setRowNum(rowNum);
		result.setSmltId(excn.getSmltId());
		result.setSmltType(smltType);
		result.setRgtrId(nvl(excn.getRgtrId()));
		result.setDeptNm(nvl(excn.getDeptNm()));
		result.setUserNm(nvl(excn.getUserNm()));
		result.setBgnDt(nvl(excn.getBgnDt()));
		result.setEndDt(nvl(excn.getEndDt()));
		result.setExecMin(excn.getExecMin());
		result.setExecStatus(toExecStatus(excn.getSmltExcnSttsCd()));

		return result;
	}

	// 종료일시가 없으면 아직 도는 중이다
	private SmltExecStatus toExecStatus(String smltExcnSttsCd) {
		return SmltExecStatus.DONE.getValue().equals(smltExcnSttsCd) ? SmltExecStatus.DONE : SmltExecStatus.RUNNING;
	}

	// DB 는 P01/P02/P03, 화면은 T1/T2 다. 탑승동(P02)은 T1 에 붙는다
	private TerminalKind toTerminalKind(String tmnlId) {
		return TMNL_ID_P03.equals(tmnlId) ? TerminalKind.T2 : TerminalKind.T1;
	}

	private String nvl(String value) {
		return value != null ? value : EMPTY;
	}
}
