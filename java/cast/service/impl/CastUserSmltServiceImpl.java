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
    private final CastExecutionMapper executionMapper;
    private final CastSmltMapper castSmltMapper;
    private final CastUserReqMapper castUserReqMapper;
    private final CastUserSnapshotService castUserSnapshotService;
    private final CastFltPsgService fltService;
    private final CastChknService chknService;
    private final CastDepService depService;
    private final CastFltPsgMapper fltMapper;
    private final CastChknMapper chknMapper;
    private final CastDepMapper depMapper;
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
        SessionUtils.setUserContext(request, sessionService);
        if (request.getLoginUserId() == null) throw new IllegalStateException("로그인을 진행해주세요.");
        executionService.validateYmd(request.getYmd());
        executionService.lock();
        validateEdits(request.getFltPsgList(), request.getYmd());
        validateEdits(request.getChknList(), request.getYmd());
        validateEdits(request.getDepList(), request.getYmd());
        for (UserSmltFltPsgSaveDto edit : list(request.getFltPsgList())) requireSuccess(fltService.saveFltPsgInfo(edit));
        for (UserSmltChknSaveDto edit : list(request.getChknList())) requireSuccess(chknService.saveChknCounterInfo(edit));
        for (UserSmltDepSaveDto edit : list(request.getDepList())) requireSuccess(depService.saveDepInfo(edit));

        String id = executionService.nextId();
        SmltMasterDto master = new SmltMasterDto();
        SessionUtils.setUserContext(master, sessionService);
        master.setSmltId(id);
        master.setSmltType(SmltType.USER.getDbCode());
        master.setExcnYmd(request.getYmd());
        master.setSmltStts("New");
        executionMapper.insertMaster(master);
        for (TerminalKind terminal : List.of(TerminalKind.T1, TerminalKind.T2)) freezeTerminal(id, request.getYmd(), terminal);
        UserSmltRsrcSnapshotDto snapshot = castUserSnapshotService.publish(id, request.getYmd());
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
    private void freezeTerminal(String id, String ymd, TerminalKind terminal) {
        UserSmltFltPsgSearchDto fq = new UserSmltFltPsgSearchDto();
        fq.setYmd(ymd); fq.setTmnlId(terminal);
        UserSmltChknSearchDto cq = new UserSmltChknSearchDto();
        cq.setYmd(ymd); cq.setTmnlId(terminal);
        UserSmltDepSearchDto dq = new UserSmltDepSearchDto();
        dq.setYmd(ymd); dq.setTmnlId(terminal);
        UserSmltFltPsgDto flt = fltService.retrieveFltPsgInfo(fq);
        UserSmltChknDto chkn = chknService.retrieveChknCounterInfo(cq);
        UserSmltDepDto dep = depService.retrieveDepInfo(dq);
        requireSuccess(flt); requireSuccess(chkn); requireSuccess(dep);
        if (flt.getFltCnt() == 0) throw new IllegalStateException(terminal.getValue() + " " + ymd + " 운항 운영자료가 없습니다.");
        if (!executionService.hasSaved(cq, "CHKN") && chkn.getIslandList().stream().noneMatch(island -> !island.getOprTimeList().isEmpty() && island.getBoothList().stream().anyMatch(booth -> booth.getAlnCd() != null && !booth.getAlnCd().isBlank()))) throw new IllegalStateException(terminal.getValue() + " 체크인 운영자료가 없습니다.");
        if (!executionService.hasSaved(dq, "DEP") && dep.getDptgtList().stream().noneMatch(gate -> !gate.getOprTimeList().isEmpty())) throw new IllegalStateException(terminal.getValue() + " 출국장 운영자료가 없습니다.");
        executionService.freeze(id, terminal.getFcltTmnlId(), "FLT_PSG", flt);
        executionService.freeze(id, terminal.getFcltTmnlId(), "CHKN", chkn);
        executionService.freeze(id, terminal.getFcltTmnlId(), "DEP", dep);
        UserSmltFltPsgSaveDto fs = new UserSmltFltPsgSaveDto();
        snapshotScope(fs, id, ymd, terminal); fs.setAjmtRt(flt.getAjmtRt());
        fltMapper.insertUserFltPsg(fs);
        UserSmltChknSaveDto cs = new UserSmltChknSaveDto();
        snapshotScope(cs, id, ymd, terminal); cs.setIslandList(chkn.getIslandList());
        for (ChknIslandDto island : cs.getIslandList()) {
            island.setBoothList(island.getBoothList().stream().filter(booth -> booth.getAlnCd() != null && !booth.getAlnCd().isBlank()).collect(java.util.stream.Collectors.toList()));
            island.setBoothCnt(island.getBoothList().size());
        }
        if (!cs.getIslandList().isEmpty()) chknMapper.insertUserChknIslandList(cs);
        if (cs.getIslandList().stream().anyMatch(island -> !island.getOprTimeList().isEmpty())) chknMapper.insertUserChknOperHrList(cs);
        if (cs.getIslandList().stream().anyMatch(island -> !island.getBoothList().isEmpty())) chknMapper.insertUserChknBoothList(cs);
        UserSmltDepSaveDto ds = new UserSmltDepSaveDto();
        snapshotScope(ds, id, ymd, terminal); ds.setDptgtList(dep.getDptgtList());
        if (!ds.getDptgtList().isEmpty()) depMapper.insertUserDepList(ds);
        if (ds.getDptgtList().stream().anyMatch(gate -> !gate.getOprTimeList().isEmpty())) depMapper.insertUserDepOperHrList(ds);
        if (ds.getDptgtList().stream().anyMatch(gate -> !gate.getPlanList().isEmpty())) depMapper.insertUserScPlanList(ds);
    }
    private void snapshotScope(UserSmltCurrentDto dto, String id, String ymd, TerminalKind terminal) {
        dto.setYmd(ymd); dto.setTmnlId(terminal);
        executionService.scope(dto); dto.setSnapshotSmltId(id);
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
