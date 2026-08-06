package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.ToIntFunction;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.FltPsgChartDto;
import aoms.pm.cast.dto.FltPsgChartItemDto;
import aoms.pm.cast.dto.FltPsgHourDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.UserSmltFltPsgDto;
import aoms.pm.cast.dto.UserSmltFltPsgSearchDto;
import aoms.pm.cast.enums.AdjType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFltPsgMapper;
import aoms.pm.cast.service.CastFltPsgService;
import aoms.pm.cast.service.CastSmltService;
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
public class CastFltPsgServiceImpl implements CastFltPsgService {
	// 막대 차트 시간축 — 04시부터 2시간 단위 12구간 (화면 스케일과 동일)
	private static final List<String> CHART_HOUR_LIST =
			List.of("04", "06", "08", "10", "12", "14", "16", "18", "20", "22", "00", "02");
	private static final int CHART_HOUR_STEP = 2;
	private static final String ZERO_MIN = "00";
	private static final String END_OF_DAY = "2400";
	private static final String DEFAULT_PEAK_TIME = "0000";

	private final CastSmltService castSmltService;
	private final CastFltPsgMapper castFltPsgMapper;

	@Override
	public UserSmltFltPsgDto retrieveFltPsgInfo(UserSmltFltPsgSearchDto searchDto) {
		UserSmltFltPsgDto result = new UserSmltFltPsgDto();
		TerminalKind tmnlId = searchDto.getTmnlId();

		// T1 은 제1여객터미널(P01) + 탑승동(P02) 합산
		List<FltPsgRawDto> rawList = castFltPsgMapper.retrieveFltPsgHourList(getExcnYmd(searchDto), tmnlId.getFltTmnlIdList());
		Map<String, FltPsgRawDto> rawMap = rawList.stream()
				.collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (a, b) -> a));

		List<FltPsgHourDto> hourList = getHourDatas(rawMap);

		result.setTmnlId(tmnlId.getValue());
		result.setFltCnt(rawList.stream().mapToInt(FltPsgRawDto::getFltCnt).sum());
		result.setPsgCnt(rawList.stream().mapToInt(FltPsgRawDto::getPsgCnt).sum());
		result.setPeakTime(getPeakTime(hourList));
		// 수정 방식·비율을 담을 컬럼이 없다 — 4단계 저장 구조 확보 후 채운다
		result.setAdjType(AdjType.RATIO);
		result.setAdjRate(0);
		result.setFltChart(getChart(rawMap, FltPsgRawDto::getFltCnt));
		result.setPsgChart(getChart(rawMap, FltPsgRawDto::getPsgCnt));
		result.setHourList(hourList);

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
			int cnt = 0;

			for (int i = 0; i < CHART_HOUR_STEP; i++) {
				cnt += getCnt(rawMap, String.format("%02d", Integer.parseInt(chartHour) + i), valueGetter);
			}

			itemList.add(new FltPsgChartItemDto().withTime(chartHour).withCnt(cnt));
		}

		result.setTotCnt(itemList.stream().mapToInt(FltPsgChartItemDto::getCnt).sum());
		result.setMaxCnt(itemList.stream().mapToInt(FltPsgChartItemDto::getCnt).max().orElse(0));
		result.setItemList(itemList);

		return result;
	}

	private List<FltPsgHourDto> getHourDatas(Map<String, FltPsgRawDto> rawMap) {
		List<FltPsgHourDto> result = new ArrayList<>();
		List<String> hourList = TimeBucketUtils.hourList();

		for (int i = 0; i < hourList.size(); i++) {
			String hour = hourList.get(i);
			boolean isLast = i + 1 == hourList.size();

			FltPsgHourDto item = new FltPsgHourDto();
			item.setBgnTime(hour + ZERO_MIN);
			item.setEndTime(isLast ? END_OF_DAY : hourList.get(i + 1) + ZERO_MIN);
			// 시간대별 조정 비율을 담을 컬럼이 없다 — 4단계 저장 구조 확보 후 채운다
			item.setAdjRate(0);
			item.setPsgCnt(getCnt(rawMap, hour, FltPsgRawDto::getPsgCnt));

			result.add(item);
		}

		return result;
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
