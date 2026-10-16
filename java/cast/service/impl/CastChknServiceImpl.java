package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.ChknRawDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.TimeRange;
import aoms.pm.cast.dto.UserChknBoothRawDto;
import aoms.pm.cast.dto.UserChknOperHrRawDto;
import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.dto.UserSmltChknDto;
import aoms.pm.cast.dto.UserSmltChknSaveDto;
import aoms.pm.cast.dto.UserSmltChknSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.SlfType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastChknMapper;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.cast.service.CastSmltService;

import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastChknServiceImpl implements CastChknService {
    private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("CC");
    private static final List<String> BOOTH_USE_CRG_TYPE_CD_LIST = List.of("A", "B");
    private static final String CUSTOM_YN_Y = "Y";
    private static final String CUSTOM_YN_N = "N";
    private static final String EMPTY_ALN_CD = "";
    private static final int PERCENT = 100;

    private static final int SIDE_BOOTHS = 18;

    private static final int ISLAND_BOOTHS = SIDE_BOOTHS * 2;

    private static final List<String> ISLAND_CD_LIST =
            List.of("A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N");

    private final CastSmltService castSmltService;
    private final CastSlfchknService castSlfchknService;
    private final CastChknMapper castChknMapper;
    private final CastExecutionService executionService;
    private final CastResourceConditionService resourceConditionService;

    @Override
    public Map<String, List<UserConfigChknDto>> retrieveChknMapGroupByIsland(String ymd, String tmnlId) {
        List<ChknRawDto> chknList = castChknMapper.retrieveChknList(ymd, tmnlId);
        Map<String, List<UserConfigChknDto>> result = new LinkedHashMap<>();

        for (String islandCd : ISLAND_CD_LIST) {
            List<ChknRawDto> islandChknList = chknList.stream()
                    .filter(chkn -> islandCd.equals(chkn.getIsland()))
                    .collect(toList());

            List<Integer> counterNumList = islandChknList.stream()
                    .map(ChknRawDto::getCounterNum)
                    .distinct()
                    .sorted()
                    .collect(toList());

            List<UserConfigChknDto> boothList = new ArrayList<>();

            for (Integer counterNum : counterNumList) {
                List<ChknRawDto> counterChknList = islandChknList.stream()
                        .filter(chkn -> counterNum.equals(chkn.getCounterNum()))
                        .collect(toList());

                boothList.add(new UserConfigChknDto().factory(counterChknList));
            }

            result.put(islandCd, boothList);
        }

        return result;
    }

    @Override
    public UserSmltChknDto retrieveChknCounterInfo(UserSmltChknSearchDto searchDto) {
        if (searchDto.getTmnlId() == null) throw new IllegalStateException("터미널을 지정해주세요.");
        SmltStngDto refs = searchDto.getSmltId() != null && !searchDto.getSmltId().isBlank()
                ? executionService.resources(searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId()) : null;
        if (refs == null) executionService.scope(searchDto);
        else searchDto.setYmd(refs.getExcnYmd());
        UserSmltChknDto result = new UserSmltChknDto();
        TerminalKind tmnlId = searchDto.getTmnlId();
        String fcltTmnlId = tmnlId.getFcltTmnlId();
        String excnYmd = getExcnYmd(searchDto);

        List<CknctCntRawDto> cknctCntList = castChknMapper.retrieveCknctCntList(fcltTmnlId, BOOTH_USE_CRG_TYPE_CD_LIST);
        List<String> islandCdList = cknctCntList.stream().map(CknctCntRawDto::getIsland).collect(toList());
        List<ChknIslandDto> islandList = refs == null
                ? getIslandList(searchDto, excnYmd, fcltTmnlId, islandCdList)
                : resourceConditionService.islands(refs, fcltTmnlId);
        List<Integer> hourlyOprBoothCntList = getHourlyOprBoothCntList(islandList);
        List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(executionService.baseId(searchDto.getYmd()), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
        int totCnt = cknctCntList.stream().mapToInt(CknctCntRawDto::getCknctCnt).sum();

        SmltKpiDto kpi = castSmltService.retrieveSmltKpi(executionService.baseId(searchDto.getYmd()), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
        kpi.setUtilRate(getUtilRate(hourlyOprBoothCntList, totCnt));

        result.setTmnlId(tmnlId.getValue());
        result.setTotCnt(totCnt);
        result.setPeakCounterCnt(hourlyOprBoothCntList.stream().mapToInt(Integer::intValue).max().orElse(0));
        result.setTotKioskCnt(islandList.stream().mapToInt(ChknIslandDto::getKioskCnt).sum());
        result.setTotBagDropCnt(islandList.stream().mapToInt(ChknIslandDto::getBagDropCnt).sum());
        result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
        result.setIslandCdList(refs == null ? islandCdList : islandList.stream().map(ChknIslandDto::getIsland).collect(toList()));
        result.setAlnCdList(refs == null ? castChknMapper.retrieveAlnCdList(excnYmd, fcltTmnlId)
                : islandList.stream().flatMap(island -> island.getBoothList().stream()).map(ChknBoothDto::getAlnCd).distinct().sorted().collect(toList()));
        result.setIslandList(islandList);
        result.setWaitList(waitList);
        result.setKpi(kpi);

        return result;
    }

    @Override
    public JsonResponse saveChknCounterInfo(UserSmltChknSaveDto saveDto) {
        executionService.scope(saveDto);
        executionService.lock();

        JsonResponse validationError = validate(saveDto);

        if (validationError != null) {
            return validationError;
        }

        saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());
        saveDto.setIslandList(normalizeIslandList(saveDto.getIslandList()));

        castChknMapper.deleteUserChknBoothList(saveDto);
        castChknMapper.deleteUserChknOperHrList(saveDto);
        castChknMapper.deleteUserChknIslandList(saveDto);

        executionService.saved(saveDto, "CHKN");
        if (saveDto.getIslandList().isEmpty()) {
            return new JsonResponse();
        }

        castChknMapper.insertUserChknIslandList(saveDto);

        if (saveDto.getIslandList().stream().anyMatch(island -> !island.getOprTimeList().isEmpty())) {
            castChknMapper.insertUserChknOperHrList(saveDto);
        }

        if (saveDto.getIslandList().stream().anyMatch(island -> !island.getBoothList().isEmpty())) {
            castChknMapper.insertUserChknBoothList(saveDto);
        }

        return new JsonResponse();
    }

    private String getExcnYmd(UserSmltChknSearchDto searchDto) { return searchDto.getYmd(); }

    private List<ChknIslandDto> getIslandList(
            UserSmltChknSearchDto searchDto,
            String excnYmd,
            String fcltTmnlId,
            List<String> islandCdList
    ) {
        List<ChknIslandDto> savedIslandList = getSavedIslandList(searchDto);

        if (executionService.hasSaved(searchDto, "CHKN")) {
            return savedIslandList;
        }

        Map<String, List<UserConfigChknDto>> allotBoothMap =
                retrieveChknMapGroupByIsland(excnYmd, fcltTmnlId);
        Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
                .stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

        return getAllotIslandList(islandCdList, allotBoothMap, slfDeviceMap);
    }

    private List<ChknIslandDto> getSavedIslandList(UserSmltChknSearchDto scope) {
        List<ChknIslandDto> result = castChknMapper.retrieveUserChknIslandList(scope);

        if (result.isEmpty()) {
            return result;
        }

        Map<String, List<UserChknOperHrRawDto>> operHrMap = castChknMapper.retrieveUserChknOperHrList(scope)
                .stream().collect(Collectors.groupingBy(UserChknOperHrRawDto::getIsland));
        Map<String, List<UserChknBoothRawDto>> boothMap = castChknMapper.retrieveUserChknBoothList(scope)
                .stream().collect(Collectors.groupingBy(UserChknBoothRawDto::getIsland));

        for (ChknIslandDto island : result) {
            List<UserChknBoothRawDto> savedBoothList = boothMap.getOrDefault(island.getIsland(), new ArrayList<>());
            Map<Integer, String> alnCdMap = new LinkedHashMap<>();
            Map<Integer, String> customYnMap = new LinkedHashMap<>();

            for (UserChknBoothRawDto booth : savedBoothList) {
                alnCdMap.put(booth.getBoothNo(), emptyIfNull(booth.getAlnCd()));
                customYnMap.put(booth.getBoothNo(), toCustomYn(booth.getCstmAltmntYn()));
            }

            island.setOprTimeList(operHrMap.getOrDefault(island.getIsland(), new ArrayList<>()).stream()
                    .map(operHr -> new OprTimeDto()
                            .withOperBgngHour(operHr.getOperBgngHour())
                            .withOperEndHour(operHr.getOperEndHour()))
                    .collect(toList()));
            island.setBoothList(toBoothList(alnCdMap, customYnMap));
        }

        return result;
    }

    private List<ChknIslandDto> getAllotIslandList(
            List<String> islandCdList,
            Map<String, List<UserConfigChknDto>> allotBoothMap,
            Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap
    ) {
        List<ChknIslandDto> result = new ArrayList<>();

        for (String islandCd : islandCdList) {
            List<UserConfigChknDto> allotBoothList = allotBoothMap.getOrDefault(islandCd, new ArrayList<>());

            if (allotBoothList.isEmpty()) {
                continue;
            }

            List<TimeRange> boothTimeRangeList = allotBoothList.stream()
                    .flatMap(booth -> booth.getTimeRanges().stream())
                    .collect(toList());
            List<SlfDeviceCntRawDto> slfDeviceList = slfDeviceMap.getOrDefault(islandCd, new ArrayList<>());
            Map<Integer, String> alnCdMap = toAlnCdMap(allotBoothList);

            ChknIslandDto island = new ChknIslandDto();
            island.setIsland(islandCd);

            island.setBoothCnt(alnCdMap.size());
            island.setKioskCnt(getDeviceCnt(slfDeviceList, SlfType.KIOSK));
            island.setBagDropCnt(getDeviceCnt(slfDeviceList, SlfType.SBD));
            island.setOprTimeList(toOprTimeList(SmltUtils.mergeTimeRanges(boothTimeRangeList)));
            island.setBoothList(toBoothList(alnCdMap, new LinkedHashMap<>()));

            result.add(island);
        }

        return result;
    }

    private Map<Integer, String> toAlnCdMap(List<UserConfigChknDto> allotBoothList) {
        Map<Integer, String> result = new LinkedHashMap<>();

        allotBoothList.stream()
                .sorted(Comparator.comparingInt(UserConfigChknDto::getCounterNum))
                .forEach(booth -> result.put(booth.getCounterNum(), emptyIfNull(booth.getAlnCd())));

        return result;
    }

    private List<ChknBoothDto> toBoothList(Map<Integer, String> alnCdMap, Map<Integer, String> customYnMap) {
        List<ChknBoothDto> result = new ArrayList<>();

        int maxBoothNo = alnCdMap.keySet().stream().mapToInt(Integer::intValue).max().orElse(0);

        for (int boothNo = 1; boothNo <= Math.max(ISLAND_BOOTHS, maxBoothNo); boothNo++) {
            result.add(new ChknBoothDto()
                    .withBoothNo(boothNo)
                    .withAlnCd(alnCdMap.getOrDefault(boothNo, EMPTY_ALN_CD))
                    .withCstmAltmntYn(customYnMap.getOrDefault(boothNo, CUSTOM_YN_N)));
        }

        return result;
    }

    private List<OprTimeDto> toOprTimeList(List<TimeRange> timeRangeList) {
        return timeRangeList.stream()
                .map(range -> new OprTimeDto().withOperBgngHour(range.getStart()).withOperEndHour(range.getEnd()))
                .collect(toList());
    }

    private int getDeviceCnt(List<SlfDeviceCntRawDto> slfDeviceList, SlfType slfType) {
        return slfDeviceList.stream()
                .filter(device -> slfType == device.getSlfType())
                .mapToInt(SlfDeviceCntRawDto::getDeviceCnt)
                .sum();
    }

    private List<Integer> getHourlyOprBoothCntList(List<ChknIslandDto> islandList) {
        List<Integer> result = new ArrayList<>();

        for (String hour : TimeBucketUtils.hourList()) {
            int hourValue = Integer.parseInt(hour);
            result.add(islandList.stream()
                    .filter(island -> isOpr(island.getOprTimeList(), hourValue))
                    .mapToInt(ChknIslandDto::getBoothCnt)
                    .sum());
        }

        return result;
    }

    private boolean isOpr(List<OprTimeDto> oprTimeList, int hour) {
        return oprTimeList.stream()
                .anyMatch(oprTime -> oprTime.getOperBgngHour() <= hour && hour < oprTime.getOperEndHour());
    }

    private int getUtilRate(List<Integer> hourlyOprBoothCntList, int totCnt) {
        if (totCnt == 0) {
            return 0;
        }

        int oprBoothHour = hourlyOprBoothCntList.stream().mapToInt(Integer::intValue).sum();

        return oprBoothHour * PERCENT / (totCnt * hourlyOprBoothCntList.size());
    }

    private JsonResponse validate(UserSmltChknSaveDto saveDto) {
        if (saveDto.getLoginUserId() == null) {
            return new JsonResponse().error("로그인을 진행해주세요.");
        }

        if (saveDto.getYmd() == null || saveDto.getYmd().isEmpty() || saveDto.getTmnlId() == null) {
            return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
        }

        return null;
    }

    private List<ChknIslandDto> normalizeIslandList(List<ChknIslandDto> islandList) {
        if (islandList == null) {
            return new ArrayList<>();
        }

        List<ChknIslandDto> result = islandList.stream()
                .filter(island -> island.getIsland() != null && !island.getIsland().isEmpty())
                .collect(toList());

        for (ChknIslandDto island : result) {
            island.setOprTimeList(island.getOprTimeList() != null ? island.getOprTimeList() : new ArrayList<>());
            island.setBoothList(normalizeBoothList(island.getBoothList()));

            island.setBoothCnt(island.getBoothList().size());
        }

        return result;
    }

    private List<ChknBoothDto> normalizeBoothList(List<ChknBoothDto> boothList) {
        if (boothList == null) {
            return new ArrayList<>();
        }

        List<ChknBoothDto> result = boothList.stream()
                .filter(booth -> booth.getAlnCd() != null && !booth.getAlnCd().isEmpty())
                .collect(toList());

        for (ChknBoothDto booth : result) {
            booth.setCstmAltmntYn(toCustomYn(booth.getCstmAltmntYn()));
        }

        return result;
    }

    private String emptyIfNull(String value) {
        return value != null ? value : EMPTY_ALN_CD;
    }

    private String toCustomYn(String value) {
        return CUSTOM_YN_Y.equals(value) ? CUSTOM_YN_Y : CUSTOM_YN_N;
    }
}
