package aoms.pm.cast.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.dto.FcltUnitRawDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDsbdMapper;
import aoms.pm.cast.service.CastDepQueueService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastDepQueueServiceImpl.java
 * @Description : 출국장 보안검색 Queue 원천 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 17. / 노세찬 / 최초작성
 * 2026. 10. 24. / 노세찬 / 실행 모델별 원천으로 하루치 조회
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CastDepQueueServiceImpl implements CastDepQueueService {
	private static final List<String> DEP_QUEUE_FCLT_CD_LIST = List.of("SC", "SR");

	private final CastDsbdMapper castDsbdMapper;

	@Override
	public DepQueueDay calculateDepQueueDay(SmltStngDto smltStng, TerminalKind tmnlId) {
		LocalDateTime dayStart = LocalDate.parse(smltStng.getExcnYmd(), DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();

		// 자정 직후의 직전 30분과 잔여 대기열 역추정은 전날 결과다. 결과 시각이 구간 끝이라 다음 날 00:00 행까지 읽는다
		return new DepQueueDay(
				tmnlId,
				castDsbdMapper.retrieveRsltByUnitList(smltStng.getSmltId(), tmnlId.getFcltTmnlId(), dayStart.minusDays(1),
						dayStart.plusDays(1).plusMinutes(DepQueueDay.CAST_SLOT_MIN), null, DEP_QUEUE_FCLT_CD_LIST, smltStng.getSmltMdlSn()),
				retrieveScrtyOpenCntMap(smltStng, tmnlId));
	}

	@Override
	public Map<String, Integer> retrieveScrtyOpenCntMap(SmltStngDto smltStng, TerminalKind tmnlId) {
		String fcltTmnlId = tmnlId.getFcltTmnlId();
		String resourceId = smltStng.getFcltyOpngScrtyCntrlRsrcId();

		if (resourceId == null || resourceId.isEmpty()) {
			throw new IllegalStateException("실행 리소스 정보를 찾을 수 없습니다. smltId=" + smltStng.getSmltId() + ", column=FCLTY_OPNG_SCRTY_CNTRL_RSRC_ID");
		}

		Map<String, Integer> result = new LinkedHashMap<>();

		for (FcltUnitRawDto raw : castDsbdMapper.retrieveScrtyOpenCountList(fcltTmnlId, resourceId)) {
			String unitCd = raw.getUnitCd() != null ? raw.getUnitCd().trim() : "";

			if (raw.getTotCnt() != 1) {
				throw new IllegalStateException("보안검색대 운영 snapshot 에 같은 게이트 행이 둘 이상입니다. smltId=" + smltStng.getSmltId()
						+ ", tmnlId=" + fcltTmnlId + ", resourceId=" + resourceId + ", unitCd=" + unitCd + ", rowCount=" + raw.getTotCnt());
			}

			result.put(unitCd, raw.getOprCnt());
		}

		return result;
	}
}
