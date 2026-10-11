package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.Comparator;
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
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFltPsgMapper;
import aoms.pm.cast.service.CastFltPsgService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SessionUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/* Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved. */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastFltPsgServiceImpl implements CastFltPsgService {
	private static final List<String> CHART_HOUR_LIST =
			List.of("00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22");
	private static final int CHART_HOUR_STEP = 2;
	private static final String ZERO_MIN = "00";
	private static final String END_OF_DAY = "2400";
	private static final String DEFAULT_PEAK_TIME = "0000";
	private static final int AJMT_RT_MIN = -100;
	private static final int AJMT_RT_MAX = 100;

	private final CastSmltService castSmltService;
	private final CastFltPsgMapper castFltPsgMapper;
	private final SessionService sessionService;

	@Override
	public UserSmltFltPsgDto retrieveFltPsgInfo(UserSmltFltPsgSearchDto searchDto) {
		UserSmltFltPsgDto result = new UserSmltFltPsgDto();
		TerminalKind tmnlId = searchDto.getTmnlId();

		List<FltPsgRawDto> rawList = castFltPsgMapper.retrieveFltPsgHourList(getExcnYmd(searchDto), tmnlId.getFltTmnlIdList());
		Map<String, FltPsgRawDto> rawMap = rawList.stream()
				.collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));
		UserFltPsgRawDto saved = castFltPsgMapper.retrieveUserFltPsg(searchDto.getSmltId(), tmnlId.getFcltTmnlId());
		List<FltPsgHourDto> hourList = toHourList(rawMap);

		result.setTmnlId(tmnlId.getValue());
		result.setFltCnt(rawList.stream().mapToInt(FltPsgRawDto::getFltCnt).sum());
		result.setPsgCnt(rawList.stream().mapToInt(FltPsgRawDto::getPsgCnt).sum());
		result.setPeakTime(getPeakTime(hourList));
		result.setAjmtRt(saved != null ? saved.getAjmtRt() : 0);
		result.setFltChart(getChart(rawMap, FltPsgRawDto::getFltCnt));
		result.setPsgChart(getChart(rawMap, FltPsgRawDto::getPsgCnt));
		result.setHourList(hourList);

		return result;
	}

	@Override
	public JsonResponse saveFltPsgInfo(UserSmltFltPsgSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		JsonResponse validationError = validate(saveDto);

		if (validationError != null) {
			return validationError;
		}

		saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());

		if (castFltPsgMapper.updateUserFltPsg(saveDto) == 0) {
			castFltPsgMapper.insertUserFltPsg(saveDto);
		}

		return new JsonResponse();
	}

	private String getExcnYmd(UserSmltFltPsgSearchDto searchDto) {
		String ymd = searchDto.getYmd();

		return ymd != null && !ymd.isEmpty()
				? ymd
				: castSmltService.retrieveSmltStngByKey(searchDto.getSmltId()).getExcnYmd();
	}

	private FltPsgChartDto getChart(Map<String, FltPsgRawDto> rawMap, ToIntFunction<FltPsgRawDto> valueGetter) {
		FltPsgChartDto result = new FltPsgChartDto();
		List<FltPsgChartItemDto> itemList = new ArrayList<>();

		for (String chartHour : CHART_HOUR_LIST) {
			int bucketCnt = 0;

			for (int hourOffset = 0; hourOffset < CHART_HOUR_STEP; hourOffset++) {
				String hour = String.format("%02d", Integer.parseInt(chartHour) + hourOffset);
				bucketCnt += getCnt(rawMap, hour, valueGetter);
			}

			itemList.add(new FltPsgChartItemDto().withTime(chartHour).withCnt(bucketCnt));
		}

		result.setTotCnt(itemList.stream().mapToInt(FltPsgChartItemDto::getCnt).sum());
		result.setMaxCnt(itemList.stream().mapToInt(FltPsgChartItemDto::getCnt).max().orElse(0));
		result.setItemList(itemList);

		return result;
	}

	private List<FltPsgHourDto> toHourList(Map<String, FltPsgRawDto> rawMap) {
		List<FltPsgHourDto> result = new ArrayList<>();
		List<String> hourList = TimeBucketUtils.hourList();

		for (int index = 0; index < hourList.size(); index++) {
			String hour = hourList.get(index);
			boolean isLastHour = index + 1 == hourList.size();

			FltPsgHourDto hourItem = new FltPsgHourDto();
			hourItem.setBgnTime(hour + ZERO_MIN);
			hourItem.setEndTime(isLastHour ? END_OF_DAY : hourList.get(index + 1) + ZERO_MIN);

			hourItem.setPsgCnt(getCnt(rawMap, hour, FltPsgRawDto::getPsgCnt));

			result.add(hourItem);
		}

		return result;
	}

	private String getPeakTime(List<FltPsgHourDto> hourList) {
		return hourList.stream()
				.max(Comparator.comparingInt(FltPsgHourDto::getPsgCnt))
				.map(FltPsgHourDto::getBgnTime)
				.orElse(DEFAULT_PEAK_TIME);
	}

	private int getCnt(Map<String, FltPsgRawDto> rawMap, String hour, ToIntFunction<FltPsgRawDto> valueGetter) {
		FltPsgRawDto raw = rawMap.get(hour);
		return raw != null ? valueGetter.applyAsInt(raw) : 0;
	}

	private JsonResponse validate(UserSmltFltPsgSaveDto saveDto) {
		if (saveDto.getLoginUserId() == null) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (saveDto.getSmltId() == null || saveDto.getSmltId().isEmpty() || saveDto.getTmnlId() == null) {
			return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
		}

		if (isOutOfRange(saveDto.getAjmtRt())) {
			return new JsonResponse().error("수정 비율은 -100 ~ 100 사이여야 합니다.");
		}

		return null;
	}

	private boolean isOutOfRange(int ajmtRt) {
		return ajmtRt < AJMT_RT_MIN || ajmtRt > AJMT_RT_MAX;
	}
}
