package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.ChknBoothAltmntDto;
import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.ChknRawDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.UserChknBoothAltmntRawDto;
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

import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastChknServiceImpl implements CastChknService {
    private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("CC");
    private static final int PERCENT = 100;
    private static final int HOURS = 24;

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

        List<CknctCntRawDto> cknctCntList = castChknMapper.retrieveCknctCntList(fcltTmnlId);
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
                : islandList.stream()
                        .flatMap(island -> island.getBoothList().stream())
                        .flatMap(booth -> booth.getAltmntList().stream())
                        .map(ChknBoothAltmntDto::getAlnCd)
                        .distinct().sorted().collect(toList()));
        result.setIslandList(islandList);
        result.setWaitList(waitList);
        result.setKpi(kpi);

        return result;
    }

    @Override
    public JsonResponse saveChknCounterInfo(UserSmltChknSaveDto saveDto) {
        executionService.scope(saveDto);

        JsonResponse validationError = validate(saveDto);

        if (validationError != null) {
            return validationError;
        }

        saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());

        String islandError = normalizeIslandList(saveDto);

        if (islandError != null) {
            return new JsonResponse().error(islandError);
        }

        castChknMapper.deleteUserChknBoothAltmntList(saveDto);
        castChknMapper.deleteUserChknIslandList(saveDto);

        if (saveDto.getIslandList().isEmpty()) {
            return new JsonResponse();
        }

        castChknMapper.insertUserChknIslandList(saveDto);

        if (saveDto.getIslandList().stream().anyMatch(island -> island.getBoothCnt() > 0)) {
            castChknMapper.insertUserChknBoothAltmntList(saveDto);
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

        if (!savedIslandList.isEmpty()) {
            return savedIslandList;
        }

        Map<String, List<ChknRawDto>> allotMap = castChknMapper.retrieveChknList(excnYmd, fcltTmnlId)
                .stream().collect(Collectors.groupingBy(ChknRawDto::getIsland));
        Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap = castSlfchknService.retrieveSlfDeviceCntList(fcltTmnlId)
                .stream().collect(Collectors.groupingBy(SlfDeviceCntRawDto::getIsland));

        return getAllotIslandList(islandCdList, allotMap, slfDeviceMap);
    }

    private List<ChknIslandDto> getSavedIslandList(UserSmltChknSearchDto scope) {
        List<ChknIslandDto> result = castChknMapper.retrieveUserChknIslandList(scope);

        if (result.isEmpty()) {
            return result;
        }

        Map<String, List<UserChknBoothAltmntRawDto>> altmntMap = castChknMapper.retrieveUserChknBoothAltmntList(scope)
                .stream().collect(Collectors.groupingBy(UserChknBoothAltmntRawDto::getIsland));

        for (ChknIslandDto island : result) {
            Map<Integer, List<ChknBoothAltmntDto>> boothAltmntMap = new TreeMap<>();

            for (UserChknBoothAltmntRawDto raw : altmntMap.getOrDefault(island.getIsland(), new ArrayList<>())) {
                boothAltmntMap.computeIfAbsent(raw.getBoothNo(), boothNo -> new ArrayList<>())
                        .add(toAltmnt(raw.getAlnCd(), raw.getOperBgngHour(), raw.getOperEndHour()));
            }

            island.setBoothList(toBoothList(boothAltmntMap));
        }

        return result;
    }

    private List<ChknIslandDto> getAllotIslandList(
            List<String> islandCdList,
            Map<String, List<ChknRawDto>> allotMap,
            Map<String, List<SlfDeviceCntRawDto>> slfDeviceMap
    ) {
        List<ChknIslandDto> result = new ArrayList<>();

        for (String islandCd : islandCdList) {
            Map<Integer, List<ChknRawDto>> counterMap = allotMap.getOrDefault(islandCd, new ArrayList<>()).stream()
                    .collect(Collectors.groupingBy(ChknRawDto::getCounterNum, TreeMap::new, toList()));
            Map<Integer, List<ChknBoothAltmntDto>> boothAltmntMap = new TreeMap<>();

            counterMap.forEach((counterNum, rows) -> {
                List<ChknBoothAltmntDto> altmntList = toAllotAltmntList(rows);
                if (!altmntList.isEmpty()) boothAltmntMap.put(counterNum, altmntList);
            });

            if (boothAltmntMap.isEmpty()) {
                continue;
            }

            List<SlfDeviceCntRawDto> slfDeviceList = slfDeviceMap.getOrDefault(islandCd, new ArrayList<>());

            ChknIslandDto island = new ChknIslandDto();
            island.setIsland(islandCd);
            island.setBoothCnt(boothAltmntMap.size());
            island.setKioskCnt(getDeviceCnt(slfDeviceList, SlfType.KIOSK));
            island.setBagDropCnt(getDeviceCnt(slfDeviceList, SlfType.SBD));
            island.setBoothList(toBoothList(boothAltmntMap));

            result.add(island);
        }

        return result;
    }

    /**
     * 시 단위로 내림 · 올림하면 분 단위로 붙어 있던 구간이 겹친다(KE 06:00~09:30 → 6~10, OZ 09:30~12:00 → 9~12).
     * 시각마다 시작이 늦은 구간의 항공사를 쓴다(계획 §3.2). 시작이 같으면 항공사 코드가 앞선 쪽.
     */
    private List<ChknBoothAltmntDto> toAllotAltmntList(List<ChknRawDto> rows) {
        String[] alnCdByHour = new String[HOURS];

        rows.stream()
                .sorted(Comparator.comparingInt(ChknRawDto::getStart)
                        .thenComparing(ChknRawDto::getAlnCd, Comparator.nullsFirst(Comparator.reverseOrder())))
                .filter(row -> row.getAlnCd() != null && !row.getAlnCd().isEmpty())
                .forEach(row -> paint(alnCdByHour, row.getAlnCd(), row.getStart(), row.getEnd()));

        return toAltmntList(alnCdByHour);
    }

    private void paint(String[] alnCdByHour, String alnCd, int bgngHour, int endHour) {
        for (int hour = Math.max(bgngHour, 0); hour < Math.min(endHour, HOURS); hour++) {
            alnCdByHour[hour] = alnCd;
        }
    }

    private List<ChknBoothAltmntDto> toAltmntList(String[] alnCdByHour) {
        List<ChknBoothAltmntDto> result = new ArrayList<>();
        int hour = 0;

        while (hour < HOURS) {
            String alnCd = alnCdByHour[hour];

            if (alnCd == null) {
                hour++;
                continue;
            }

            int bgngHour = hour;

            while (hour < HOURS && alnCd.equals(alnCdByHour[hour])) {
                hour++;
            }

            result.add(toAltmnt(alnCd, bgngHour, hour));
        }

        return result;
    }

    private ChknBoothAltmntDto toAltmnt(String alnCd, int bgngHour, int endHour) {
        return new ChknBoothAltmntDto().withAlnCd(alnCd).withOperBgngHour(bgngHour).withOperEndHour(endHour);
    }

    private List<ChknBoothDto> toBoothList(Map<Integer, List<ChknBoothAltmntDto>> boothAltmntMap) {
        List<ChknBoothDto> result = new ArrayList<>();

        int maxBoothNo = boothAltmntMap.keySet().stream().mapToInt(Integer::intValue).max().orElse(0);

        for (int boothNo = 1; boothNo <= Math.max(ISLAND_BOOTHS, maxBoothNo); boothNo++) {
            result.add(new ChknBoothDto()
                    .withBoothNo(boothNo)
                    .withAltmntList(boothAltmntMap.getOrDefault(boothNo, new ArrayList<>())));
        }

        return result;
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
            result.add((int) islandList.stream()
                    .flatMap(island -> island.getBoothList().stream())
                    .filter(booth -> isOpr(booth.getAltmntList(), hourValue))
                    .count());
        }

        return result;
    }

    private boolean isOpr(List<ChknBoothAltmntDto> altmntList, int hour) {
        return altmntList.stream()
                .anyMatch(altmnt -> altmnt.getOperBgngHour() <= hour && hour < altmnt.getOperEndHour());
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

    /** 부스 배정을 검증하고 같은 항공사의 붙은 구간을 합친다. 검증 실패면 오류 문구를 돌려준다. */
    private String normalizeIslandList(UserSmltChknSaveDto saveDto) {
        List<ChknIslandDto> islandList = saveDto.getIslandList() == null ? new ArrayList<>() : saveDto.getIslandList();
        Map<String, Integer> cknctCntMap = castChknMapper.retrieveCknctCntList(saveDto.getFcltTmnlId()).stream()
                .collect(Collectors.toMap(CknctCntRawDto::getIsland, CknctCntRawDto::getCknctCnt, Integer::sum));

        List<ChknIslandDto> result = islandList.stream()
                .filter(island -> island.getIsland() != null && !island.getIsland().isEmpty())
                .collect(toList());

        for (ChknIslandDto island : result) {
            int maxBoothNo = Math.max(ISLAND_BOOTHS, cknctCntMap.getOrDefault(island.getIsland(), 0));
            Map<Integer, String[]> hourMap = new TreeMap<>();
            List<ChknBoothDto> boothList = island.getBoothList() == null ? new ArrayList<>() : island.getBoothList();

            for (ChknBoothDto booth : boothList) {
                if (booth.getBoothNo() < 1 || booth.getBoothNo() > maxBoothNo) {
                    return island.getIsland() + " 아일랜드 부스 번호(" + booth.getBoothNo() + ")가 범위를 벗어났습니다.";
                }

                String[] alnCdByHour = hourMap.computeIfAbsent(booth.getBoothNo(), boothNo -> new String[HOURS]);
                List<ChknBoothAltmntDto> altmntList = booth.getAltmntList() == null ? new ArrayList<>() : booth.getAltmntList();

                for (ChknBoothAltmntDto altmnt : altmntList) {
                    String altmntError = checkAltmnt(island.getIsland(), booth.getBoothNo(), altmnt, alnCdByHour);
                    if (altmntError != null) return altmntError;
                    paint(alnCdByHour, altmnt.getAlnCd(), altmnt.getOperBgngHour(), altmnt.getOperEndHour());
                }
            }

            List<ChknBoothDto> normalized = new ArrayList<>();
            hourMap.forEach((boothNo, alnCdByHour) -> {
                List<ChknBoothAltmntDto> altmntList = toAltmntList(alnCdByHour);
                if (!altmntList.isEmpty()) normalized.add(new ChknBoothDto().withBoothNo(boothNo).withAltmntList(altmntList));
            });

            island.setBoothList(normalized);
            island.setBoothCnt(normalized.size());
        }

        saveDto.setIslandList(result);
        return null;
    }

    private String checkAltmnt(String island, int boothNo, ChknBoothAltmntDto altmnt, String[] alnCdByHour) {
        String booth = island + " 아일랜드 " + boothNo + "번 부스";

        if (altmnt.getAlnCd() == null || altmnt.getAlnCd().isEmpty()) {
            return booth + "의 항공사가 비어 있습니다.";
        }

        if (altmnt.getOperBgngHour() < 0 || altmnt.getOperEndHour() > HOURS || altmnt.getOperBgngHour() >= altmnt.getOperEndHour()) {
            return booth + "의 운영시간(" + altmnt.getOperBgngHour() + "~" + altmnt.getOperEndHour() + "시)이 올바르지 않습니다.";
        }

        for (int hour = altmnt.getOperBgngHour(); hour < altmnt.getOperEndHour(); hour++) {
            if (alnCdByHour[hour] != null) {
                return booth + "의 배정 시간이 겹칩니다(" + hour + "시).";
            }
        }

        return null;
    }
}
