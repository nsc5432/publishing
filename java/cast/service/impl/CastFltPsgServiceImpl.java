package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.ToIntFunction;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.FltPsgChartDto;
import aoms.pm.cast.dto.FltPsgChartItemDto;
import aoms.pm.cast.dto.FltPsgHourDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.UserFltPsgRawDto;
import aoms.pm.cast.dto.UserSmltFltPsgDto;
import aoms.pm.cast.dto.UserSmltFltPsgSaveDto;
import aoms.pm.cast.dto.UserSmltFltPsgSearchDto;
import aoms.pm.cast.enums.AdjType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFltPsgMapper;
import aoms.pm.cast.service.CastFltPsgService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SessionUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastFltPsgServiceImpl.java
 * @Description : 운항편/여객수 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 07. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastFltPsgServiceImpl implements CastFltPsgService {
	// 막대 차트 시간축 — 04시부터 2시간 단위 12구간 (화면 스케일과 동일)
	private static final List<String> CHART_HOUR_LIST =
			List.of("04", "06", "08", "10", "12", "14", "16", "18", "20", "22", "00", "02");
	private static final int CHART_HOUR_STEP = 2;
	private static final String ZERO_MIN = "00";
	private static final String END_OF_DAY = "2400";
	private static final String DEFAULT_PEAK_TIME = "0000";
	private static final int ADJ_RATE_MIN = -100;
	private static final int ADJ_RATE_MAX = 100;

	private final CastSmltService castSmltService;
	private final CastFltPsgMapper castFltPsgMapper;
	private final SessionService sessionService;

	@Override
	public UserSmltFltPsgDto retrieveFltPsgInfo(UserSmltFltPsgSearchDto searchDto) {
		UserSmltFltPsgDto result = new UserSmltFltPsgDto();
		TerminalKind tmnlId = searchDto.getTmnlId();

		// T1 은 제1여객터미널(P01) + 탑승동(P02) 합산
		List<FltPsgRawDto> rawList = castFltPsgMapper.retrieveFltPsgHourList(getExcnYmd(searchDto), tmnlId.getFltTmnlIdList());
		Map<String, FltPsgRawDto> rawMap = rawList.stream()
				.collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));
		UserFltPsgRawDto saved = castFltPsgMapper.retrieveUserFltPsg(searchDto.getSmltId(), tmnlId.getFcltTmnlId());
		Map<String, FltPsgHourDto> savedHourMap = castFltPsgMapper
				.retrieveUserFltPsgHourList(searchDto.getSmltId(), tmnlId.getFcltTmnlId())
				.stream().collect(Collectors.toMap(FltPsgHourDto::getBgnTime, Function.identity(), (first, ignored) -> first));

		List<FltPsgHourDto> hourList = getHourDatas(rawMap, savedHourMap);

		result.setTmnlId(tmnlId.getValue());
		result.setFltCnt(rawList.stream().mapToInt(FltPsgRawDto::getFltCnt).sum());
		result.setPsgCnt(rawList.stream().mapToInt(FltPsgRawDto::getPsgCnt).sum());
		result.setPeakTime(getPeakTime(hourList));
		result.setAdjType(toAdjType(saved));
		result.setAdjRate(saved != null ? saved.getAdjRate() : 0);
		result.setFltChart(getChart(rawMap, FltPsgRawDto::getFltCnt));
		result.setPsgChart(getChart(rawMap, FltPsgRawDto::getPsgCnt));
		result.setHourList(hourList);

		return result;
	}

	/*
	 * 저장 전략 — 헤더 1행(SMLT_ID + TMNL_ID)은 병합(update-or-insert), 시간대별 목록은 전체 교체.
	 *
	 * 저장하는 것은 조정 "비율"뿐이다. 곱해진 편별 여객수를 TN_PM_SMLT_SCHDL_ATRB 에 물리
	 * 저장하면 원본 복원이 불가능해지므로 채택하지 않았다. 비율은 CAST 리소스 발행 시점에
	 * 운항 스케줄에 곱한다 (CastRsrcServiceImpl.publishUserSmltRsrc 1단계).
	 */
	@Override
	public JsonResponse saveFltPsgInfo(UserSmltFltPsgSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		JsonResponse invalid = validate(saveDto);

		if (invalid != null) {
			return invalid;
		}

		saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());
		saveDto.setAdjType(saveDto.getAdjType() != null ? saveDto.getAdjType() : AdjType.RATIO);
		saveDto.setAdjTypeCd(saveDto.getAdjType().getValue());
		saveDto.setHourList(normalizeHourList(saveDto.getHourList()));

		// 병합 — 있으면 갱신(LAST_* 3종 함께), 없으면 신규 등록
		if (castFltPsgMapper.updateUserFltPsg(saveDto) == 0) {
			castFltPsgMapper.insertUserFltPsg(saveDto);
		}

		castFltPsgMapper.deleteUserFltPsgHrList(saveDto);

		// INSERT ALL 은 INTO 절이 0개면 문법 오류다. 비어 있으면 호출하지 않는다
		if (!saveDto.getHourList().isEmpty()) {
			castFltPsgMapper.insertUserFltPsgHrList(saveDto);
		}

		return new JsonResponse();
	}

	// 검증은 서비스 안에서 명시적으로 한다. 통과하면 null
	private JsonResponse validate(UserSmltFltPsgSaveDto saveDto) {
		if (saveDto.getLoginUserId() == null) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (saveDto.getSmltId() == null || saveDto.getSmltId().isEmpty() || saveDto.getTmnlId() == null) {
			return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
		}

		if (isOutOfRange(saveDto.getAdjRate())) {
			return new JsonResponse().error("수정 비율은 -100 ~ 100 사이여야 합니다.");
		}

		if (saveDto.getHourList() != null && saveDto.getHourList().stream().anyMatch(x -> isOutOfRange(x.getAdjRate()))) {
			return new JsonResponse().error("시간대별 수정 비율은 -100 ~ 100 사이여야 합니다.");
		}

		return null;
	}

	private boolean isOutOfRange(int adjRate) {
		return adjRate < ADJ_RATE_MIN || adjRate > ADJ_RATE_MAX;
	}

	// null 을 그대로 바인딩하면 Oracle 이 JdbcType 을 못 정한다. 시각이 없는 행은 버린다
	private List<FltPsgHourDto> normalizeHourList(List<FltPsgHourDto> hourList) {
		if (hourList == null) {
			return new ArrayList<>();
		}

		List<FltPsgHourDto> result = hourList.stream()
				.filter(x -> x.getBgnTime() != null && !x.getBgnTime().isEmpty())
				.collect(Collectors.toList());

		for (FltPsgHourDto hour : result) {
			hour.setEndTime(hour.getEndTime() != null ? hour.getEndTime() : END_OF_DAY);
		}

		return result;
	}

	// 기준일자는 요청에 있으면 그대로, 없으면 시뮬레이션 설정의 실행일자를 쓴다
	private String getExcnYmd(UserSmltFltPsgSearchDto searchDto) {
		String ymd = searchDto.getYmd();
		return ymd != null && !ymd.isEmpty() ? ymd : castSmltService.retrieveSmltStngByKey(searchDto.getSmltId()).getExcnYmd();
	}

	private FltPsgChartDto getChart(Map<String, FltPsgRawDto> rawMap, ToIntFunction<FltPsgRawDto> valueGetter) {
		FltPsgChartDto result = new FltPsgChartDto();
		List<FltPsgChartItemDto> itemList = new ArrayList<>();

		for (String chartHour : CHART_HOUR_LIST) {
			int bucketCnt = 0;

			for (int i = 0; i < CHART_HOUR_STEP; i++) {
				bucketCnt += getCnt(rawMap, String.format("%02d", Integer.parseInt(chartHour) + i), valueGetter);
			}

			itemList.add(new FltPsgChartItemDto().withTime(chartHour).withCnt(bucketCnt));
		}

		result.setTotCnt(itemList.stream().mapToInt(FltPsgChartItemDto::getCnt).sum());
		result.setMaxCnt(itemList.stream().mapToInt(FltPsgChartItemDto::getCnt).max().orElse(0));
		result.setItemList(itemList);

		return result;
	}

	private List<FltPsgHourDto> getHourDatas(
			Map<String, FltPsgRawDto> rawMap,
			Map<String, FltPsgHourDto> savedHourMap
	) {
		List<FltPsgHourDto> result = new ArrayList<>();
		List<String> hourList = TimeBucketUtils.hourList();

		for (int i = 0; i < hourList.size(); i++) {
			String hour = hourList.get(i);
			boolean isLast = i + 1 == hourList.size();

			FltPsgHourDto item = new FltPsgHourDto();
			item.setBgnTime(hour + ZERO_MIN);
			item.setEndTime(isLast ? END_OF_DAY : hourList.get(i + 1) + ZERO_MIN);
			FltPsgHourDto saved = savedHourMap.get(item.getBgnTime());

			if (saved != null) {
				item.setEndTime(saved.getEndTime());
				item.setAdjRate(saved.getAdjRate());
			}

			item.setPsgCnt(getCnt(rawMap, hour, FltPsgRawDto::getPsgCnt));

			result.add(item);
		}

		return result;
	}

	private AdjType toAdjType(UserFltPsgRawDto saved) {
		if (saved != null && AdjType.HOURLY.getValue().equals(saved.getAdjTypeCd())) {
			return AdjType.HOURLY;
		}

		return AdjType.RATIO;
	}

	// 피크 시간 = 여객수가 가장 많은 시간대
	private String getPeakTime(List<FltPsgHourDto> hourList) {
		return hourList.stream()
				.sorted((a, b) -> b.getPsgCnt() - a.getPsgCnt())
				.map(FltPsgHourDto::getBgnTime)
				.findFirst()
				.orElse(DEFAULT_PEAK_TIME);
	}

	private int getCnt(Map<String, FltPsgRawDto> rawMap, String hour, ToIntFunction<FltPsgRawDto> valueGetter) {
		FltPsgRawDto raw = rawMap.get(hour);
		return raw != null ? valueGetter.applyAsInt(raw) : 0;
	}
}
