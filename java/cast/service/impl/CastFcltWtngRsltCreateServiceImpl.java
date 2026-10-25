package aoms.pm.cast.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.wtng.FcltWtngScope;
import aoms.pm.cast.dto.FcltWtngRsltDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.service.CastFcltWtngRsltCreateService;
import aoms.pm.cast.service.CastFcltWtngRsltWriter;
import aoms.pm.cast.service.CastFcltWtngService;
import aoms.pm.cast.service.CastSmltService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @Classname : CastFcltWtngRsltCreateServiceImpl.java
 * @Description : 시뮬레이션 결과 수신 후 시설 대기 결과 최초 저장 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CastFcltWtngRsltCreateServiceImpl implements CastFcltWtngRsltCreateService {
	private static final List<FcltType> FCLT_TYPE_LIST = List.of(FcltType.CHKN, FcltType.DEP);

	private final CastSmltService castSmltService;
	private final CastFcltWtngService castFcltWtngService;
	private final CastFcltWtngRsltWriter castFcltWtngRsltWriter;

	// 원천 수신 트랜잭션에 참여해 모든 저장 단위를 함께 롤백한다
	@Override
	@Transactional(rollbackFor = Exception.class)
	public void createInitialResult(String smltId, int smltMdlSn, String loginIpAddr) {
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByModel(smltId, smltMdlSn);

		for (TerminalKind tmnlId : TerminalKind.getList()) {
			for (FcltType fcltType : FCLT_TYPE_LIST) {
				String context = "smltId=" + smltId + ", smltMdlSn=" + smltMdlSn + ", tmnlId=" + tmnlId.getValue() + ", fcltType=" + fcltType.getValue();

				int rowCnt = createScope(smltStng, tmnlId, fcltType, context, loginIpAddr);

				log.info("시설 대기 결과 최초 저장: {}, rowCount={}", context, rowCnt);
			}
		}
	}

	// 저장 전에 저장 단위 전체를 메모리에서 대조하고, 일부 시설 / 시간대만 커밋하지 않는다
	private int createScope(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType, String context, String loginIpAddr) {
		FcltWtngScope scope = castFcltWtngService.calculateScope(smltStng, tmnlId, fcltType);
		String gap = scope.findGapOf(scope.getSecMap());

		if (gap != null) {
			throw new IllegalStateException("저장할 10분 결과가 기대 시설 / 구간과 다릅니다. " + context + ", " + gap);
		}

		List<FcltWtngRsltDto> rowList = FcltWtngRsltRows.toRowList(smltStng.getSmltId(), smltStng.getSmltMdlSn(), tmnlId, fcltType, scope.getSecMap());

		castFcltWtngRsltWriter.insertScope(rowList, loginIpAddr);

		return rowList.size();
	}
}
