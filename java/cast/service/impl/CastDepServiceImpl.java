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

import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.ScPlanDto;
import aoms.pm.cast.dto.SmltKpiDto;

import aoms.pm.cast.dto.UserDepOperHrRawDto;
import aoms.pm.cast.dto.UserScPlanRawDto;
import aoms.pm.cast.dto.UserSmltDepDto;
import aoms.pm.cast.dto.UserSmltDepSaveDto;
import aoms.pm.cast.dto.UserSmltDepSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.cast.service.CastOperHrService;
import aoms.pm.cast.service.CastSmltService;

import aoms.pm.utils.SmltUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastDepServiceImpl implements CastDepService {
    private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("LGT");
    private static final String OPR_YN_Y = "Y";
    private static final String OPR_YN_N = "N";
    private static final int HOUR_PER_DAY = 24;
    private static final int PERCENT = 100;
    private static final int FIRST_PLAN_SN = 1;

    private final CastSmltService castSmltService;
    private final CastOperHrService castOperHrService;
    private final CastDepMapper castDepMapper;
    private final CastExecutionService executionService;

    @Override
    public UserSmltDepDto retrieveDepInfo(UserSmltDepSearchDto searchDto) {
        if (searchDto.getSmltId() != null && !searchDto.getSmltId().isBlank()) {
            return executionService.frozen(searchDto.getSmltId(), searchDto.getTmnlId().getFcltTmnlId(), "DEP", UserSmltDepDto.class);
        }
        executionService.scope(searchDto);
        UserSmltDepDto result = new UserSmltDepDto();
        TerminalKind tmnlId = searchDto.getTmnlId();
        String fcltTmnlId = tmnlId.getFcltTmnlId();

        List<DepGateDto> dptgtList = getGateList(searchDto, fcltTmnlId);
        List<Integer> oprScCntList = getOprScCntList(dptgtList);
        List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(executionService.baseId(searchDto.getYmd()), fcltTmnlId, UP_PSG_FCLT_CD_LIST);

        SmltKpiDto kpi = castSmltService.retrieveSmltKpi(executionService.baseId(searchDto.getYmd()), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
        kpi.setUtilRate(getUtilRate(dptgtList));

        result.setTmnlId(tmnlId.getValue());
        result.setPeakScshCntom(oprScCntList.stream().mapToInt(Integer::intValue).max().orElse(0));
        result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
        result.setDptgtList(dptgtList);
        result.setWaitList(waitList);
        result.setKpi(kpi);

        return result;
    }

    @Override
    public JsonResponse saveDepInfo(UserSmltDepSaveDto saveDto) {
        executionService.scope(saveDto);
        executionService.lock();

        JsonResponse validationError = validate(saveDto);

        if (validationError != null) {
            return validationError;
        }

        saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());
        saveDto.setDptgtList(normalizeDepList(saveDto.getDptgtList()));

        castDepMapper.deleteUserScPlanList(saveDto);
        castDepMapper.deleteUserDepOperHrList(saveDto);
        castDepMapper.deleteUserDepList(saveDto);

        executionService.saved(saveDto, "DEP");
        if (saveDto.getDptgtList().isEmpty()) {
            return new JsonResponse();
        }

        castDepMapper.insertUserDepList(saveDto);

        if (saveDto.getDptgtList().stream().anyMatch(gate -> !gate.getOprTimeList().isEmpty())) {
            castDepMapper.insertUserDepOperHrList(saveDto);
        }

        if (saveDto.getDptgtList().stream().anyMatch(gate -> !gate.getPlanList().isEmpty())) {
            castDepMapper.insertUserScPlanList(saveDto);
        }

        return new JsonResponse();
    }

    private List<DepGateDto> getGateList(UserSmltDepSearchDto scope, String fcltTmnlId) {
        if (!executionService.hasSaved(scope, "DEP")) return getBaseGateList(scope.getYmd(), fcltTmnlId);
        Map<String, String> names = castDepMapper.retrieveDepFcltList(fcltTmnlId).stream()
            .collect(Collectors.toMap(DepFcltRawDto::getDptgtNo, DepFcltRawDto::getDptgtNm));
        List<DepGateDto> saved = new ArrayList<>(getSavedGateMap(scope).values());
        saved.forEach(gate -> gate.setDptgtNm(names.getOrDefault(gate.getDptgtNo(), gate.getDptgtNo())));
        return saved;
    }

    private List<DepGateDto> getBaseGateList(String ymd, String fcltTmnlId) {

        List<DepFcltRawDto> fcltList = castDepMapper.retrieveDepFcltList(fcltTmnlId);
        Map<String, List<DepOperHrRawDto>> operHrMap = castOperHrService
                .retrieveDepOperHrMap(fcltTmnlId, ymd);
        Map<String, Integer> scCntMap = castDepMapper
                .retrieveScCntList(fcltTmnlId, "FacilityOpeningTable_SecurityControl001")
                .stream().collect(Collectors.toMap(ScCntRawDto::getDptgtNo, ScCntRawDto::getScshCntom, (first, ignored) -> first));

        for (DepFcltRawDto facility : fcltList) {
            if (operHrMap.containsKey(facility.getDptgtNo()) && !scCntMap.containsKey(facility.getDptgtNo())) throw new IllegalStateException("출국장 " + facility.getDptgtNo() + " 기본 보안검색대 운영자료가 없습니다.");
        }
        return toGateList(fcltList, operHrMap, scCntMap);
    }

    private Map<String, DepGateDto> getSavedGateMap(UserSmltDepSearchDto scope) {
        Map<String, DepGateDto> result = new LinkedHashMap<>();
        List<DepGateDto> savedList = castDepMapper.retrieveUserDepList(scope);

        if (savedList.isEmpty()) {
            return result;
        }

        Map<String, List<UserDepOperHrRawDto>> operHrMap = castDepMapper.retrieveUserDepOperHrList(scope)
                .stream().collect(Collectors.groupingBy(UserDepOperHrRawDto::getDptgtNo));
        Map<String, List<UserScPlanRawDto>> planMap = castDepMapper.retrieveUserScPlanList(scope)
                .stream().collect(Collectors.groupingBy(UserScPlanRawDto::getDptgtNo));

        for (DepGateDto saved : savedList) {
            saved.setDptgtNm(saved.getDptgtNo());
            saved.setOprTimeList(operHrMap.getOrDefault(saved.getDptgtNo(), new ArrayList<>()).stream()
                    .map(operHr -> new OprTimeDto()
                            .withOperBgngHour(operHr.getOperBgngHour())
                            .withOperEndHour(operHr.getOperEndHour()))
                    .collect(toList()));
            saved.setPlanList(planMap.getOrDefault(saved.getDptgtNo(), new ArrayList<>()).stream()
                    .map(plan -> new ScPlanDto()
                            .withPlanSn(plan.getPlanSn())
                            .withOperBgngHour(plan.getOperBgngHour())
                            .withOperEndHour(plan.getOperEndHour())
                            .withScshCntom(plan.getScshCntom()))
                    .collect(toList()));

            result.put(saved.getDptgtNo(), saved);
        }

        return result;
    }

    private List<DepGateDto> toGateList(
            List<DepFcltRawDto> fcltList,
            Map<String, List<DepOperHrRawDto>> operHrMap,
            Map<String, Integer> scCntMap
    ) {
        List<DepGateDto> result = new ArrayList<>();

        for (DepFcltRawDto fclt : fcltList) {
            String dptgtNo = fclt.getDptgtNo();
            List<OprTimeDto> oprTimeList = toOprTimeList(operHrMap.getOrDefault(dptgtNo, new ArrayList<>()));
            int scshCntom = scCntMap.getOrDefault(dptgtNo, 0);

            DepGateDto gate = new DepGateDto();
            gate.setDptgtNo(dptgtNo);
            gate.setDptgtNm(fclt.getDptgtNm());
            gate.setOprYn(fclt.getUseYn());
            gate.setScshCntom(scshCntom);

            gate.setGnrlSrchCntom(0);
            gate.setSmartPassSrchCntom(0);
            gate.setOprTimeList(oprTimeList);
            gate.setPlanList(toPlanList(oprTimeList, scshCntom));

            result.add(gate);
        }

        return result;
    }

    private List<OprTimeDto> toOprTimeList(List<DepOperHrRawDto> operHrList) {
        return operHrList.stream()
                .map(operHr -> new OprTimeDto()
                        .withOperBgngHour(SmltUtils.toBgnHour(operHr.getBgnHm()))
                        .withOperEndHour(SmltUtils.toEndHour(operHr.getBgnHm(), operHr.getEndHm())))
                .sorted(Comparator.comparingInt(OprTimeDto::getOperBgngHour))
                .collect(toList());
    }

    private List<ScPlanDto> toPlanList(List<OprTimeDto> oprTimeList, int scshCntom) {
        List<ScPlanDto> result = new ArrayList<>();

        if (oprTimeList.isEmpty()) {
            return result;
        }

        int operBgngHour = oprTimeList.stream().mapToInt(OprTimeDto::getOperBgngHour).min().orElse(0);
        int operEndHour = oprTimeList.stream().mapToInt(OprTimeDto::getOperEndHour).max().orElse(0);

        result.add(new ScPlanDto()
                .withPlanSn(FIRST_PLAN_SN)
                .withScshCntom(scshCntom)
                .withOperBgngHour(operBgngHour)
                .withOperEndHour(operEndHour));

        return result;
    }

    private List<Integer> getOprScCntList(List<DepGateDto> dptgtList) {
        List<Integer> result = new ArrayList<>();

        for (String hour : TimeBucketUtils.hourList()) {
            int hourValue = Integer.parseInt(hour);
            result.add(dptgtList.stream()
                    .filter(gate -> isOpr(gate, hourValue))
                    .mapToInt(gate -> getScshCntom(gate, hourValue))
                    .sum());
        }

        return result;
    }

    private int getScshCntom(DepGateDto gate, int hour) {
        return gate.getPlanList().stream()
                .filter(plan -> plan.getOperBgngHour() <= hour && hour < plan.getOperEndHour())
                .mapToInt(ScPlanDto::getScshCntom)
                .findFirst()
                .orElse(0);
    }

    private boolean isOpr(DepGateDto gate, int hour) {
        return OPR_YN_Y.equals(gate.getOprYn())
                && gate.getOprTimeList().stream()
                        .anyMatch(oprTime -> oprTime.getOperBgngHour() <= hour && hour < oprTime.getOperEndHour());
    }

    private int getUtilRate(List<DepGateDto> dptgtList) {
        if (dptgtList.isEmpty()) {
            return 0;
        }

        int oprGateHour = 0;

        for (String hour : TimeBucketUtils.hourList()) {
            int hourValue = Integer.parseInt(hour);
            oprGateHour += (int) dptgtList.stream().filter(gate -> isOpr(gate, hourValue)).count();
        }

        return oprGateHour * PERCENT / (dptgtList.size() * HOUR_PER_DAY);
    }

    private JsonResponse validate(UserSmltDepSaveDto saveDto) {
        if (saveDto.getLoginUserId() == null) {
            return new JsonResponse().error("로그인을 진행해주세요.");
        }

        if (saveDto.getYmd() == null || saveDto.getYmd().isEmpty() || saveDto.getTmnlId() == null) {
            return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
        }

        return null;
    }

    private List<DepGateDto> normalizeDepList(List<DepGateDto> dptgtList) {
        if (dptgtList == null) {
            return new ArrayList<>();
        }

        List<DepGateDto> result = dptgtList.stream()
                .filter(gate -> gate.getDptgtNo() != null && !gate.getDptgtNo().isEmpty())
                .collect(toList());

        for (DepGateDto gate : result) {
            gate.setOprYn(OPR_YN_Y.equals(gate.getOprYn()) ? OPR_YN_Y : OPR_YN_N);
            gate.setOprTimeList(gate.getOprTimeList() != null ? gate.getOprTimeList() : new ArrayList<>());
            gate.setPlanList(gate.getPlanList() != null ? gate.getPlanList() : new ArrayList<>());
        }

        return result;
    }
}
