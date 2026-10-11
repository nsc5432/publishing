package aoms.pm.cast.service.impl;

import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;
import aoms.pm.cast.mapper.CastUserSnapshotMapper;

import aoms.pm.cast.service.CastUserSnapshotService;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
public class CastUserSnapshotServiceImpl implements CastUserSnapshotService {
    private static final String DAILY_FLT_SCHDL_RSRC_ID = "FS001";
    private static final String FS = "FS";
    private static final String CA = "CA";
    private static final String SBD = "SBD";
    private static final String DEPARTURE_GATE = "FacilityOpeningTable_DepartureGate";
    private static final String SECURITY_CONTROL = "FacilityOpeningTable_SecurityControl";

    private final CastUserSnapshotMapper castUserSnapshotMapper;
    private final aoms.pm.castrest.service.CastRestService castRestService;
    private final SessionService sessionService;
    private final aoms.pm.cast.mapper.CastExecutionMapper executionMapper;
    private final CastExecutionService executionService;

    @Override
    public UserSmltRsrcSnapshotDto publish(String smltId, String excnYmd) {
        SmltStngDto dailyStng = executionMapper.retrieveInputBase(excnYmd);
        if (dailyStng == null) throw new IllegalStateException("해당 일자의 CAST 기본 입력 리소스 설정이 없습니다.");
        for (String required : new String[] { dailyStng.getMdlRsrcId(), dailyStng.getPrptSetRsrcId(), dailyStng.getCknctSrvcHrRsrcId(), dailyStng.getChknTypeRsrcId() }) {
            if (required == null || required.isBlank()) throw new IllegalStateException("모델·PropertySet·서비스시간·체크인유형 기본 설정을 확인해주세요.");
        }
        UserSmltRsrcSnapshotDto snapshot = getSnapshot(smltId, excnYmd, dailyStng);

        publishRsrc(RsrcTable.FLT_SCHDL, snapshot, this::insertSchdlAtrb);
        publishRsrc(RsrcTable.CKNCT, snapshot, castUserSnapshotMapper::insertCknctAtrb);
        publishRsrc(RsrcTable.SBD, snapshot, this::insertSbdAtrb);
        publishRsrc(RsrcTable.DPTGT, snapshot, castUserSnapshotMapper::insertDptgtAtrb);
        publishRsrc(RsrcTable.SCRTY_CNTRL, snapshot, castUserSnapshotMapper::insertScrtyCntrlAtrb);

        java.util.Map<String, String> shared = new java.util.LinkedHashMap<>();
        for (String source : new String[] { snapshot.getMdlRsrcId(), snapshot.getPrptStngRsrcId(), snapshot.getCknctSrvcHrRsrcId(), snapshot.getChknTypeRsrcId(), snapshot.getFcltyOpngDptcnyRsrcId(), snapshot.getFcltyOpngEntcnyRsrcId(), snapshot.getFcltyOpngTrScrtyCntrlRsrcId(), snapshot.getRptStngAtrbId() }) {
            if (source != null && !source.isBlank()) shared.put(source, source + "_U" + snapshot.getSmltId());
        }
        archive(snapshot, "FlightSchedule", snapshot.getFltSchdlRsrcId(), false, shared);
        archive(snapshot, "CounterAllocation", snapshot.getCknctAlctnRsrcId(), false, shared);
        archive(snapshot, "CounterAllocation", snapshot.getSbdCntrlAlctnId(), false, shared);
        archive(snapshot, "GenericTable", snapshot.getFcltyOpngDptcnySrngRsrcId(), false, shared);
        archive(snapshot, "GenericTable", snapshot.getFcltyOpngScrtyCntrlRsrcId(), false, shared);
        snapshot.setMdlRsrcId(archive(snapshot, "CASTModel", snapshot.getMdlRsrcId(), true, shared));
        snapshot.setPrptStngRsrcId(archive(snapshot, "PropertySet", snapshot.getPrptStngRsrcId(), true, shared));
        snapshot.setCknctSrvcHrRsrcId(archive(snapshot, "GenericTable", snapshot.getCknctSrvcHrRsrcId(), true, shared));
        snapshot.setChknTypeRsrcId(archive(snapshot, "GenericTable", snapshot.getChknTypeRsrcId(), true, shared));
        snapshot.setFcltyOpngDptcnyRsrcId(archive(snapshot, "GenericTable", snapshot.getFcltyOpngDptcnyRsrcId(), true, shared));
        snapshot.setFcltyOpngEntcnyRsrcId(archive(snapshot, "GenericTable", snapshot.getFcltyOpngEntcnyRsrcId(), true, shared));
        snapshot.setFcltyOpngTrScrtyCntrlRsrcId(archive(snapshot, "GenericTable", snapshot.getFcltyOpngTrScrtyCntrlRsrcId(), true, shared));
        snapshot.setRptStngAtrbId(archive(snapshot, "GenericTable", snapshot.getRptStngAtrbId(), true, shared));
        return snapshot;
    }

    private String archive(UserSmltRsrcSnapshotDto snapshot, String type, String sourceId, boolean virtual, java.util.Map<String, String> shared) {
        if (sourceId == null || sourceId.isBlank()) return sourceId;
        String id = virtual ? sourceId + "_U" + snapshot.getSmltId() : sourceId;
        if (id.length() > 100) throw new IllegalStateException("CAST 입력 리소스 ID가 100자를 초과합니다.");
        String xml = castRestService.captureResource(type, sourceId, snapshot.getExcnYmd());
        if (xml == null || !xml.contains("ResourceInfo")) throw new IllegalStateException("CAST 입력 리소스가 없습니다: " + sourceId);
        if (!shared.isEmpty()) {
            java.util.regex.Pattern references = java.util.regex.Pattern.compile("(?<![A-Za-z0-9_])(?:" + shared.keySet().stream().sorted(java.util.Comparator.comparingInt(String::length).reversed()).map(java.util.regex.Pattern::quote).collect(java.util.stream.Collectors.joining("|")) + ")(?![A-Za-z0-9_])");
            java.util.regex.Matcher matcher = references.matcher(xml);
            StringBuffer rewritten = new StringBuffer();
            while (matcher.find()) matcher.appendReplacement(rewritten, java.util.regex.Matcher.quoteReplacement(shared.get(matcher.group())));
            matcher.appendTail(rewritten);
            xml = rewritten.toString();
        }
        if (!virtual) xml = xml.replace("\"" + sourceId + "\"", "\"" + id + "\"");
        executionMapper.archiveInput(snapshot.getSmltId(), type, id, sourceId, xml);
        return id;
    }

    private UserSmltRsrcSnapshotDto getSnapshot(String smltId, String excnYmd, SmltStngDto dailyStng) {
        UserSmltRsrcSnapshotDto result = new UserSmltRsrcSnapshotDto();
        SessionUtils.setUserContext(result, sessionService);

        executionService.lock();
        String rsrcNo = executionMapper.reserveRsrcNo(smltId);
        if (rsrcNo == null) throw new IllegalStateException("가용 CAST 리소스 번호가 없습니다.");
        executionMapper.assignRsrcNo(smltId, rsrcNo);

        result.setRsrcNo(rsrcNo);
        result.setSmltId(smltId);
        result.setExcnYmd(excnYmd);

        result.setFltSchdlRsrcId(FS + rsrcNo);
        result.setCknctAlctnRsrcId(CA + rsrcNo);
        result.setSbdCntrlAlctnId(SBD + rsrcNo);
        result.setFcltyOpngDptcnySrngRsrcId(DEPARTURE_GATE + rsrcNo);
        result.setFcltyOpngScrtyCntrlRsrcId(SECURITY_CONTROL + rsrcNo);

        result.setMdlRsrcId(dailyStng.getMdlRsrcId());
        result.setPrptStngRsrcId(dailyStng.getPrptSetRsrcId());
        result.setCknctSrvcHrRsrcId(dailyStng.getCknctSrvcHrRsrcId());
        result.setChknTypeRsrcId(dailyStng.getChknTypeRsrcId());
        result.setRptStngAtrbId(dailyStng.getRptStngAtrbId());
        result.setFcltyOpngDptcnyRsrcId(dailyStng.getFcltyOpngEmiRsrcId());
        result.setFcltyOpngEntcnyRsrcId(dailyStng.getFcltyOpngImmiRsrcId());
        result.setFcltyOpngTrScrtyCntrlRsrcId(dailyStng.getFcltyOpngTrScrtyCntrlRsrcId());

        result.setSrcFltSchdlRsrcId(DAILY_FLT_SCHDL_RSRC_ID);

        return result;
    }

    private void publishRsrc(
            RsrcTable table,
            UserSmltRsrcSnapshotDto snapshot,
            Consumer<UserSmltRsrcSnapshotDto> insertAtrb
    ) {
        String rsrcNo = snapshot.getRsrcNo();

        castUserSnapshotMapper.deleteRsrcAtrb(table.atrbTableNm, table.atrbIdColumnNm, rsrcNo);
        castUserSnapshotMapper.deleteRsrcMstr(table.mstrTableNm, table.mstrIdColumnNm, rsrcNo);
        castUserSnapshotMapper.insertRsrcMstr(
                table.mstrTableNm, table.mstrIdColumnNm, table.mstrNmColumnNm, snapshot);
        insertAtrb.accept(snapshot);
    }

    private void insertSchdlAtrb(UserSmltRsrcSnapshotDto snapshot) {

        if (isDailyOperative(snapshot.getSrcFltSchdlRsrcId())) {
            castUserSnapshotMapper.insertSchdlAtrbFromDaily(snapshot);
            return;
        }

        castUserSnapshotMapper.insertSchdlAtrbFromSrc(snapshot);
    }

    private void insertSbdAtrb(UserSmltRsrcSnapshotDto snapshot) {

        castUserSnapshotMapper.insertSbdAtrb(snapshot);
        castUserSnapshotMapper.insertSbdAtrbKiosk(snapshot);
    }

    private boolean isDailyOperative(String srcFltSchdlRsrcId) {
        return srcFltSchdlRsrcId == null || srcFltSchdlRsrcId.isEmpty()
                || DAILY_FLT_SCHDL_RSRC_ID.equals(srcFltSchdlRsrcId);
    }

    private enum RsrcTable {
        FLT_SCHDL(
                "TN_PM_SMLT_SCHDL_MSTR", "SCHDL_ATRB_ID", "SCHDL_ATRB_NM",
                "TN_PM_SMLT_SCHDL_ATRB", "SCHDL_ATRB_GROUP_ID"),
        CKNCT(
                "TN_PM_SMLT_CKNCT_MSTR", "CKNCT_ATRB_ID", "CKNCT_ATRB_NM",
                "TN_PM_SMLT_CKNCT_ATRB", "SCHDL_ATRB_GROUP_ID"),
        SBD(
                "TN_PM_SMLT_SBD_MSTR", "SBD_ATRB_ID", "SBD_ATRB_NM",
                "TN_PM_SMLT_SBD_ATRB", "SCHDL_ATRB_GROUP_ID"),
        DPTGT(
                "TN_PM_SMLT_FCLTY_OPNG_DPTGT_MSTR", "DPTGT_ATRB_ID", "DPTGT_ATRB_NM",
                "TN_PM_SMLT_FCLTY_OPNG_DPTGT_ATRB", "DPTGT_ATRB_ID"),
        SCRTY_CNTRL(
                "TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_MSTR", "SCRTY_CNTRL_ATRB_ID", "SCRTY_CNTRL_ATRB_NM",
                "TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_ATRB", "SCRTY_CNTRL_ATRB_ID");

        private final String mstrTableNm;
        private final String mstrIdColumnNm;
        private final String mstrNmColumnNm;
        private final String atrbTableNm;
        private final String atrbIdColumnNm;

        RsrcTable(
                String mstrTableNm,
                String mstrIdColumnNm,
                String mstrNmColumnNm,
                String atrbTableNm,
                String atrbIdColumnNm
        ) {
            this.mstrTableNm = mstrTableNm;
            this.mstrIdColumnNm = mstrIdColumnNm;
            this.mstrNmColumnNm = mstrNmColumnNm;
            this.atrbTableNm = atrbTableNm;
            this.atrbIdColumnNm = atrbIdColumnNm;
        }
    }
}
