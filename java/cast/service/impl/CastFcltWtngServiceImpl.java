package aoms.pm.cast.service.impl;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeSet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.chkn.ChknQueueSeries;
import aoms.pm.cast.domains.chkn.ChknQueueTmnlSeries;
import aoms.pm.cast.domains.chkn.ChknWtngSecBuilder;
import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.domains.dsbd.DepWtngSecBuilder;
import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngScope;
import aoms.pm.cast.domains.wtng.FcltWtngSec;
import aoms.pm.cast.dto.FcltWtngRsltDto;
import aoms.pm.cast.dto.FcltWtngSrcDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFcltWtngRsltMapper;
import aoms.pm.cast.service.CastCgnGradeService;
import aoms.pm.cast.service.CastChknQueueService;
import aoms.pm.cast.service.CastDepQueueService;
import aoms.pm.cast.service.CastFcltWtngService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @Classname : CastFcltWtngServiceImpl.java
 * @Description : 체크인 · 출국장 10분 대기 결과 공통 조회 / 계산 ServiceImpl
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
@Transactional(readOnly = true)
public class CastFcltWtngServiceImpl implements CastFcltWtngService {
	private static final String YMD_FORMAT = "yyyyMMdd";
	private static final int MINUTE_PER_DAY = ChknQueueSeries.MINUTE_PER_DAY;
	private static final List<String> CHKN_SRC_FCLT_CD_LIST = List.of("CC");
	private static final List<String> DEP_SRC_FCLT_CD_LIST = List.of("SC", "SR");

	private final CastFcltWtngRsltMapper castFcltWtngRsltMapper;
	private final CastChknQueueService castChknQueueService;
	private final CastDepQueueService castDepQueueService;
	private final CastCgnGradeService castCgnGradeService;

	@Override
	public FcltWtngDay retrieveFcltWtngDay(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType) {
		String context = contextOf(smltStng, tmnlId, fcltType);
		FcltWtngScope expected = expectedScopeOf(smltStng, tmnlId, fcltType);
		List<FcltWtngRsltDto> rowList = castFcltWtngRsltMapper.retrieveFcltWtngRsltList(
				smltStng.getSmltId(), smltStng.getSmltMdlSn(), tmnlId.getValue(), fcltType.getValue());
		String gap = FcltWtngRsltRows.findInvalidRow(rowList);
		Map<String, List<FcltWtngSec>> secMap = gap == null ? FcltWtngRsltRows.toSecMap(rowList) : Map.of();

		if (gap == null) {
			gap = expected.findGapOf(secMap);
		}

		// 같은 범위 안에서 저장 행과 재계산 행을 섞지 않는다
		if (gap != null) {
			if (rowList.isEmpty()) {
				log.info("시설 대기 저장 결과가 없어 Java 계산으로 보완합니다. {}", context);
			} else {
				log.warn("시설 대기 저장 결과가 불완전해 Java 계산으로 보완합니다. {}, {}", context, gap);
			}

			secMap = supplement(smltStng, tmnlId, fcltType, expected, context);
		}

		return new FcltWtngDay(tmnlId, fcltType, baseDateOf(smltStng), secMap, castCgnGradeService.retrieveGradeScale(fcltType, context));
	}

	@Override
	public FcltWtngScope calculateScope(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType) {
		requireSingleExcnDt(smltStng);

		LocalDate baseDate = baseDateOf(smltStng);

		if (fcltType == FcltType.CHKN) {
			ChknQueueTmnlSeries tmnlSeries = castChknQueueService.calculateChknQueue(smltStng, tmnlId);

			return new FcltWtngScope(
					CastChknQueueService.CHKN_ISLAND_CD_LIST,
					ChknWtngSecBuilder.rangeStartOf(baseDate, tmnlSeries.getOriginMinute()),
					ChknWtngSecBuilder.rangeEndOf(baseDate),
					ChknWtngSecBuilder.build(tmnlSeries));
		}

		requireDep(fcltType);

		DepQueueDay day = castDepQueueService.calculateDepQueueDay(smltStng, tmnlId);
		List<String> unitCdList = depUnitCdList(day.unitCdList(), day.oprUnitCdList());
		LocalDateTime rangeStart = DepWtngSecBuilder.rangeStartOf(baseDate, day.firstResultDt());
		LocalDateTime rangeEnd = DepWtngSecBuilder.rangeEndOf(baseDate);

		return new FcltWtngScope(unitCdList, rangeStart, rangeEnd, DepWtngSecBuilder.build(day, unitCdList, rangeStart, rangeEnd));
	}

	private Map<String, List<FcltWtngSec>> supplement(
			SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType, FcltWtngScope expected, String context) {
		FcltWtngScope calculated = calculateScope(smltStng, tmnlId, fcltType);
		String gap = expected.hasSameRange(calculated)
				? expected.findGapOf(calculated.getSecMap())
				: "보완 계산의 시설 / 범위가 원천 경계와 다릅니다. expectedRangeStart=" + expected.getRangeStart()
						+ ", calculatedRangeStart=" + calculated.getRangeStart();

		if (gap != null) {
			throw new IllegalStateException("시설 대기 결과를 보완할 수 없습니다. " + context + ", " + gap);
		}

		return calculated.getSecMap();
	}

	/*
	 * 완전성 검사용 기대 시설 · 범위. 1분 FIFO 를 다시 돌리지 않고 원천 경계와 실행 리소스만 가볍게 읽는다.
	 * 범위 규칙은 calculateScope 의 계산 결과와 같아야 한다.
	 */
	private FcltWtngScope expectedScopeOf(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType) {
		LocalDate baseDate = baseDateOf(smltStng);
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		if (fcltType == FcltType.CHKN) {
			LocalDateTime firstDt = castFcltWtngRsltMapper.retrieveFcltWtngSrcList(
					smltStng.getSmltId(), smltStng.getSmltMdlSn(), fcltTmnlId, fcltType.getValue(), CHKN_SRC_FCLT_CD_LIST, null, null).stream()
					.filter(src -> !normalize(src.getUnitCd()).isEmpty())
					.map(FcltWtngSrcDto::getMinActlDt)
					.filter(Objects::nonNull)
					.min(Comparator.naturalOrder())
					.orElse(null);
			int originMinute = firstDt == null ? 0 : Math.max(Math.min(minuteOf(baseDate, firstDt), 0), -MINUTE_PER_DAY);

			return new FcltWtngScope(
					CastChknQueueService.CHKN_ISLAND_CD_LIST,
					ChknWtngSecBuilder.rangeStartOf(baseDate, originMinute),
					ChknWtngSecBuilder.rangeEndOf(baseDate),
					Map.of());
		}

		requireDep(fcltType);

		LocalDateTime dayStart = baseDate.atStartOfDay();
		List<FcltWtngSrcDto> srcList = castFcltWtngRsltMapper.retrieveFcltWtngSrcList(
				smltStng.getSmltId(), smltStng.getSmltMdlSn(), fcltTmnlId, fcltType.getValue(), DEP_SRC_FCLT_CD_LIST,
				dayStart.minusDays(1), dayStart.plusDays(1).plusMinutes(DepQueueDay.CAST_SLOT_MIN));
		LocalDateTime firstDt = srcList.stream()
				.map(FcltWtngSrcDto::getMinActlDt)
				.filter(Objects::nonNull)
				.min(Comparator.naturalOrder())
				.orElse(null);
		List<String> srcUnitCdList = new ArrayList<>();

		srcList.forEach(src -> srcUnitCdList.add(normalize(src.getUnitCd())));

		return new FcltWtngScope(
				depUnitCdList(srcUnitCdList, castDepQueueService.retrieveScrtyOpenCntMap(smltStng, tmnlId).keySet()),
				DepWtngSecBuilder.rangeStartOf(baseDate, firstDt),
				DepWtngSecBuilder.rangeEndOf(baseDate),
				Map.of());
	}

	// 같은 실행 · 모델에 실행일시가 다른 원천이 섞이면 임의로 합산하지 않는다
	private void requireSingleExcnDt(SmltStngDto smltStng) {
		int excnDtCnt = castFcltWtngRsltMapper.retrieveSrcExcnDtCnt(smltStng.getSmltId(), smltStng.getSmltMdlSn());

		if (excnDtCnt > 1) {
			throw new IllegalStateException("같은 실행 / 모델에 실행일시가 다른 원천 결과가 있습니다. smltId=" + smltStng.getSmltId()
					+ ", smltMdlSn=" + smltStng.getSmltMdlSn() + ", excnDtCnt=" + excnDtCnt);
		}
	}

	private List<String> depUnitCdList(Collection<String> srcUnitCdList, Collection<String> oprUnitCdList) {
		TreeSet<String> result = new TreeSet<>();

		srcUnitCdList.stream().map(this::normalize).filter(unitCd -> !unitCd.isEmpty()).forEach(result::add);
		oprUnitCdList.stream().map(this::normalize).filter(unitCd -> !unitCd.isEmpty()).forEach(result::add);

		return new ArrayList<>(result);
	}

	private void requireDep(FcltType fcltType) {
		if (fcltType != FcltType.DEP) {
			throw new IllegalArgumentException("시설 대기 결과는 CHKN / DEP 만 다룹니다. fcltType=" + fcltType);
		}
	}

	private int minuteOf(LocalDate baseDate, LocalDateTime dateTime) {
		return Math.toIntExact(Duration.between(baseDate.atStartOfDay(), dateTime).toMinutes());
	}

	private LocalDate baseDateOf(SmltStngDto smltStng) {
		return LocalDate.parse(smltStng.getExcnYmd(), DateTimeFormatter.ofPattern(YMD_FORMAT));
	}

	private String normalize(String unitCd) {
		return unitCd != null ? unitCd.trim() : "";
	}

	private String contextOf(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType) {
		return "smltId=" + smltStng.getSmltId() + ", smltMdlSn=" + smltStng.getSmltMdlSn()
				+ ", tmnlId=" + tmnlId.getValue() + ", fcltType=" + fcltType.getValue();
	}
}
