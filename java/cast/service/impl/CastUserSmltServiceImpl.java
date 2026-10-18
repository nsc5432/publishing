package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.domains.MapLayout;
import aoms.pm.cast.dto.*;
import aoms.pm.cast.enums.*;
import aoms.pm.cast.mapper.*;
import aoms.pm.cast.service.*;
import aoms.pm.utils.SessionUtils;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastUserSmltServiceImpl implements CastUserSmltService {
    private static final String EMPTY = "";
    private final CastExecutionService executionService;
    private final CastSmltMapper castSmltMapper;
    private final CastUserReqMapper castUserReqMapper;
    private final CastUserSnapshotService castUserSnapshotService;
    private final CastFltPsgService fltService;
    private final CastChknService chknService;
    private final CastDepService depService;
    private final SessionService sessionService;

    @Override
    public UserSmltInfoDto retrieveUserSmltInfo(UserSmltInfoSearchDto scope) {
        executionService.scope(scope);
        UserSmltInfoDto result = new UserSmltInfoDto();
        result.setYmd(scope.getYmd());
        result.setSaveDt(executionService.saveDt(scope));
        result.setSmltFlfmtSttsCd(EMPTY);
        return result;
    }
    @Override
    public UserSmltFcltMapDto retrieveFcltMap(UserSmltFcltMapSearchDto searchDto) {
        UserSmltFcltMapDto result = new UserSmltFcltMapDto();
        result.setTmnlId(searchDto.getTmnlId().getValue());
        result.setFcltType(searchDto.getFcltType());
        result.setIsland(emptyIfNull(searchDto.getIsland()));
        result.setMarkerList(getMarkerList(searchDto.getTmnlId(), searchDto.getFcltType(), searchDto.getIsland()));
        return result;
    }
    @Override
    public UserSmltExecDto executeUserSmlt(UserSmltExecSearchDto request) {
        executionService.validateYmd(request.getYmd());
        validateEdits(request.getFltPsgList(), request.getYmd());
        validateEdits(request.getChknList(), request.getYmd());
        validateEdits(request.getDepList(), request.getYmd());
        
        for (UserSmltFltPsgSaveDto edit : list(request.getFltPsgList())) 
            requireSuccess(fltService.saveFltPsgInfo(edit));

        for (UserSmltChknSaveDto edit : list(request.getChknList())) 
            requireSuccess(chknService.saveChknCounterInfo(edit));
        
        for (UserSmltDepSaveDto edit : list(request.getDepList())) 
            requireSuccess(depService.saveDepInfo(edit));

        String id = executionService.nextId();
        List<UserSmltCustomCondDto> customCondList = new ArrayList<>();

        for (TerminalKind terminal : List.of(TerminalKind.T1, TerminalKind.T2)) 
            customCondList.add(resolveTerminal(request.getYmd(), terminal));
        
        UserSmltRsrcSnapshotDto snapshot = castUserSnapshotService.publish(id, request.getYmd(), customCondList);
        
        SmltExcnDto history = new SmltExcnDto();
        SessionUtils.setUserContext(history, sessionService);
        history.setSmltId(id);
        history.setSmltType(SmltType.USER.getDbCode());
        history.setSmltFlfmtSttsCd(SmltExecStatus.RUNNING.getValue());
        castSmltMapper.insertSmltFlfmtHstry(history);

        String reqId = "WI" + id;
        castUserReqMapper.insertUserReq(getUserReq(id, reqId, request.getYmd(), snapshot));
        
        UserSmltExecDto result = new UserSmltExecDto();
        result.setSmltId(id);
        result.setSmltReqId(reqId);
        result.setSmltFlfmtSttsCd(SmltExecStatus.RUNNING);
        result.setSmltFlfmtBgngDt(EMPTY);
        return result;
    }
    private UserSmltCustomCondDto resolveTerminal(String ymd, TerminalKind terminal) {
        UserSmltFltPsgSearchDto fltQuery = new UserSmltFltPsgSearchDto();
        fltQuery.setYmd(ymd);
        fltQuery.setTmnlId(terminal);
        
        UserSmltChknSearchDto chknQuery = new UserSmltChknSearchDto();
        chknQuery.setYmd(ymd);
        chknQuery.setTmnlId(terminal);
        
        UserSmltDepSearchDto depQuery = new UserSmltDepSearchDto();
        depQuery.setYmd(ymd);
        depQuery.setTmnlId(terminal);
        
        UserSmltFltPsgDto flt = fltService.retrieveFltPsgInfo(fltQuery);
        UserSmltChknDto chkn = chknService.retrieveChknCounterInfo(chknQuery);
        UserSmltDepDto dep = depService.retrieveDepInfo(depQuery);
        
        requireSuccess(flt);
        requireSuccess(chkn);
        requireSuccess(dep);
        
        if (flt.getFltCnt() == 0) 
            throw new IllegalStateException(terminal.getValue() + " " + ymd + " 운항 운영자료가 없습니다.");
        
        if (!executionService.hasCurrentConditions(chknQuery, "CHKN") && chkn.getIslandList().stream().noneMatch(island -> !island.getOprTimeList().isEmpty() && island.getBoothList().stream().anyMatch(booth -> booth.getAlnCd() != null && !booth.getAlnCd().isBlank()))) 
            throw new IllegalStateException(terminal.getValue() + " 체크인 운영자료가 없습니다.");
        
        if (!executionService.hasCurrentConditions(depQuery, "DEP") && dep.getDptgtList().stream().noneMatch(gate -> !gate.getOprTimeList().isEmpty())) 
            throw new IllegalStateException(terminal.getValue() + " 출국장 운영자료가 없습니다.");
        
        return new UserSmltCustomCondDto(terminal, flt, chkn, dep);
    }
    private <T> List<T> list(List<T> values) { return values == null ? List.of() : values; }
    private void validateEdits(List<? extends UserSmltCurrentDto> edits, String ymd) {
        Set<TerminalKind> terminals = new HashSet<>();
        for (UserSmltCurrentDto edit : list(edits)) {
            if (edit == null || edit.getTmnlId() == null || !terminals.add(edit.getTmnlId())) throw new IllegalStateException("변경 영역의 터미널이 중복되거나 누락됐습니다.");
            edit.setYmd(ymd);
        }
    }
    private void requireSuccess(JsonResponse response) {
        if (response.isError()) throw new IllegalStateException(response.getErrorMessage());
    }
    private List<MapMarkerDto> getMarkerList(TerminalKind tmnlId, FcltType fcltType, String targetIslandCd) {
        List<MapMarkerDto> result = new ArrayList<>();

        if (fcltType == FcltType.DEP || fcltType == FcltType.SC) {
            for (String dptgtNo : MapLayout.dptgtNoList(tmnlId)) {
                result.add(MapLayout.dptgtMarker(tmnlId, dptgtNo));
            }

            return result;
        }

        for (String islandCd : MapLayout.islandCdList(tmnlId)) {

            if (targetIslandCd != null && !targetIslandCd.isEmpty() && !targetIslandCd.equals(islandCd)) {
                continue;
            }

            result.add(MapLayout.chknMarker(tmnlId, islandCd));
        }

        return result;
    }

    private UserSmltReqDto getUserReq(String smltId, String smltReqId, String excnYmd, UserSmltRsrcSnapshotDto snapshot) {
        UserSmltReqDto result = new UserSmltReqDto();
        SessionUtils.setUserContext(result, sessionService);

        result.setSmltReqId(smltReqId);
        result.setSmltId(smltId);
        result.setExcnYmd(excnYmd);

        result.setMdlRsrcId(snapshot.getMdlRsrcId());
        result.setFltSchdlRsrcId(snapshot.getFltSchdlRsrcId());
        result.setCknctAlctnRsrcId(snapshot.getCknctAlctnRsrcId());
        result.setSbdCntrlAlctnId(snapshot.getSbdCntrlAlctnId());
        result.setPrptStngRsrcId(snapshot.getPrptStngRsrcId());
        result.setFcltyOpngDptcnySrngRsrcId(snapshot.getFcltyOpngDptcnySrngRsrcId());
        result.setFcltyOpngDptcnyRsrcId(snapshot.getFcltyOpngDptcnyRsrcId());
        result.setFcltyOpngEntcnyRsrcId(snapshot.getFcltyOpngEntcnyRsrcId());
        result.setFcltyOpngScrtyCntrlRsrcId(snapshot.getFcltyOpngScrtyCntrlRsrcId());
        result.setFcltyOpngTrScrtyCntrlRsrcId(snapshot.getFcltyOpngTrScrtyCntrlRsrcId());
        result.setCknctSrvcHrRsrcId(snapshot.getCknctSrvcHrRsrcId());
        result.setChknTypeRsrcId(snapshot.getChknTypeRsrcId());
        result.setRptStngAtrbId(snapshot.getRptStngAtrbId());
        result.setSmltRsltSfx(smltReqId);

        return result;
    }

    private String emptyIfNull(String value) { return value == null ? EMPTY : value; }
}
