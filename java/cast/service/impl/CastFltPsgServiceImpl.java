package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.function.ToIntFunction;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.FltPsgChartDto;
import aoms.pm.cast.dto.FltPsgChartItemDto;
import aoms.pm.cast.dto.FltPsgHourDto;
import aoms.pm.cast.dto.FltPsgRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserFltPsgRawDto;
import aoms.pm.cast.dto.UserSmltFltPsgDto;
import aoms.pm.cast.dto.UserSmltFltPsgSaveDto;
import aoms.pm.cast.dto.UserSmltFltPsgSearchDto;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFltPsgMapper;
import aoms.pm.cast.mapper.CastResourceConditionMapper;
import aoms.pm.cast.service.CastFltPsgService;
import aoms.pm.cast.service.CastSmltService;

import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastFltPsgServiceImpl implements CastFltPsgService {
    private static final List<String> CHART_HOUR_LIST =
            List.of("00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22");
    private static final int CHART_HOUR_STEP = 2;
    private static final String ZERO_MIN = "00";
    private static final String END_OF_DAY = "2400";
    private static final String NO_PEAK_TIME = "";
    private static final int AJMT_RT_MIN = -100;
    private static final int AJMT_RT_MAX = 100;
    private static final int AJMT_RT_STEP = 5;

    private final CastSmltService castSmltService;
    private final CastFltPsgMapper castFltPsgMapper;
    private final CastExecutionService executionService;
    private final CastResourceConditionMapper resourceConditionMapper;

    @Override
    public UserSmltFltPsgDto retrieveFltPsgInfo(UserSmltFltPsgSearchDto searchDto) {
        if (searchDto.getTmnlId() == null) throw new IllegalStateException("터미널을 지정해주세요.");
        SmltStngDto refs = searchDto.getSmltId() != null && !searchDto.getSmltId().isBlank()
                ? executionService.resources(searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId()) : null;
        if (refs == null) executionService.scope(searchDto);
        else searchDto.setYmd(refs.getExcnYmd());
        UserSmltFltPsgDto result = new UserSmltFltPsgDto();
        TerminalKind tmnlId = searchDto.getTmnlId();

        List<FltPsgRawDto> rawList = refs == null
                ? castFltPsgMapper.retrieveFltPsgHourList(getExcnYmd(searchDto), tmnlId.getFltTmnlIdList())
                : resourceConditionMapper.retrieveFlightHours(refs.getFltSchdlRsrcId(), tmnlId.getFltTmnlIdList());
        Map<String, FltPsgRawDto> rawMap = rawList.stream()
                .collect(Collectors.toMap(FltPsgRawDto::getHour, Function.identity(), (first, ignored) -> first));
        UserFltPsgRawDto saved = refs == null ? castFltPsgMapper.retrieveUserFltPsg(searchDto) : null;
        int ajmtRt = saved != null ? saved.getAjmtRt() : 0;
        Map<String, Integer> savedHourRtMap = refs == null
                ? toHourRtMap(castFltPsgMapper.retrieveUserFltPsgHourList(searchDto)) : Map.of();
        List<FltPsgHourDto> hourList = toHourList(rawMap, savedHourRtMap, ajmtRt);

        result.setTmnlId(tmnlId.getValue());
        result.setFltCnt(rawList.stream().mapToInt(FltPsgRawDto::getFltCnt).sum());
        result.setPsgCnt(rawList.stream().mapToInt(FltPsgRawDto::getPsgCnt).sum());
        result.setPeakTime(getPeakTime(rawMap));
        result.setAjmtRt(ajmtRt);
        result.setFltChart(getChart(rawMap, FltPsgRawDto::getFltCnt));
        result.setPsgChart(getChart(rawMap, FltPsgRawDto::getPsgCnt));
        result.setHourList(hourList);

        return result;
    }

    @Override
    public JsonResponse saveFltPsgInfo(UserSmltFltPsgSaveDto saveDto) {
        executionService.scope(saveDto);

        JsonResponse validationError = validate(saveDto);

        if (validationError != null) {
            return validationError;
        }

        saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());

        if (castFltPsgMapper.updateUserFltPsg(saveDto) == 0) {
            castFltPsgMapper.insertUserFltPsg(saveDto);
        }

        castFltPsgMapper.deleteUserFltPsgHourList(saveDto);

        // INSERT ALL 은 INTO 절이 0개면 문법 오류다
        if (saveDto.getHourList() != null && !saveDto.getHourList().isEmpty()) {
            castFltPsgMapper.insertUserFltPsgHourList(saveDto);
        }

        return new JsonResponse();
    }

    private String getExcnYmd(UserSmltFltPsgSearchDto searchDto) { return searchDto.getYmd(); }

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

    private Map<String, Integer> toHourRtMap(List<FltPsgHourDto> savedHourList) {
        return savedHourList.stream()
                .collect(Collectors.toMap(FltPsgHourDto::getBgnTime, FltPsgHourDto::getAjmtRt, (first, ignored) -> first));
    }

    private List<FltPsgHourDto> toHourList(
            Map<String, FltPsgRawDto> rawMap, Map<String, Integer> savedHourRtMap, int ajmtRt
    ) {
        List<FltPsgHourDto> result = new ArrayList<>();
        List<String> hourList = TimeBucketUtils.hourList();

        for (int index = 0; index < hourList.size(); index++) {
            String hour = hourList.get(index);
            boolean isLastHour = index + 1 == hourList.size();

            FltPsgHourDto hourItem = new FltPsgHourDto();
            hourItem.setBgnTime(hour + ZERO_MIN);
            hourItem.setEndTime(isLastHour ? END_OF_DAY : hourList.get(index + 1) + ZERO_MIN);

            hourItem.setPsgCnt(getCnt(rawMap, hour, FltPsgRawDto::getPsgCnt));
            hourItem.setAjmtRt(savedHourRtMap.getOrDefault(hourItem.getBgnTime(), ajmtRt));

            result.add(hourItem);
        }

        return result;
    }

    private String getPeakTime(Map<String, FltPsgRawDto> rawMap) {
        String peakHour = null;
        int peakFltCnt = 0;

        for (String hour : TimeBucketUtils.hourList()) {
            int fltCnt = getCnt(rawMap, hour, FltPsgRawDto::getFltCnt);

            if (fltCnt > peakFltCnt) {
                peakHour = hour;
                peakFltCnt = fltCnt;
            }
        }

        return peakHour != null ? peakHour + ZERO_MIN : NO_PEAK_TIME;
    }

    private int getCnt(Map<String, FltPsgRawDto> rawMap, String hour, ToIntFunction<FltPsgRawDto> valueGetter) {
        FltPsgRawDto raw = rawMap.get(hour);
        return raw != null ? valueGetter.applyAsInt(raw) : 0;
    }

    private JsonResponse validate(UserSmltFltPsgSaveDto saveDto) {
        if (saveDto.getLoginUserId() == null) {
            return new JsonResponse().error("로그인을 진행해주세요.");
        }

        if (saveDto.getYmd() == null || saveDto.getYmd().isEmpty() || saveDto.getTmnlId() == null) {
            return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
        }

        if (isInvalidRt(saveDto.getAjmtRt())) {
            return new JsonResponse().error("수정 비율은 -100 ~ 100 사이 5% 단위여야 합니다.");
        }

        Set<String> hourBgnTimeSet = TimeBucketUtils.hourList().stream()
                .map(hour -> hour + ZERO_MIN)
                .collect(Collectors.toSet());
        Set<String> savedBgnTimeSet = new HashSet<>();
        List<FltPsgHourDto> hourList = saveDto.getHourList() != null ? saveDto.getHourList() : List.of();

        for (FltPsgHourDto hour : hourList) {
            if (hour == null || !hourBgnTimeSet.contains(hour.getBgnTime()) || !savedBgnTimeSet.add(hour.getBgnTime())) {
                return new JsonResponse().error("시간대별 수정 구간이 올바르지 않거나 중복됐습니다.");
            }

            if (isInvalidRt(hour.getAjmtRt())) {
                return new JsonResponse().error("시간대별 수정 비율은 -100 ~ 100 사이 5% 단위여야 합니다.");
            }
        }

        return null;
    }

    private boolean isInvalidRt(int ajmtRt) {
        return ajmtRt < AJMT_RT_MIN || ajmtRt > AJMT_RT_MAX || ajmtRt % AJMT_RT_STEP != 0;
    }
}
