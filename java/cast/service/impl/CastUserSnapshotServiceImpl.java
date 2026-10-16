package aoms.pm.cast.service.impl;

import java.util.List;
import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.ChknBoothDto;
import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserSmltFrozenDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.ChknBoothRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.ChknIslRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.DptgtRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.FltAjmtRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.OperHrRow;
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
    private static final String IMMIGRATION = "FacilityOpeningTable_Immigration";
    private static final String TRANSFER_SECURITY_CONTROL = "FacilityOpeningTable_TransferSecurityControl";
    private static final String PS = "PS";

    private final CastUserSnapshotMapper castUserSnapshotMapper;
    private final aoms.pm.castrest.service.CastRestService castRestService;
    private final SessionService sessionService;
    private final aoms.pm.cast.mapper.CastExecutionMapper executionMapper;
    private final CastExecutionService executionService;

    @Override
    public UserSmltRsrcSnapshotDto publish(String smltId, String excnYmd, List<UserSmltFrozenDto> frozenList) {
        SmltStngDto base = executionMapper.retrieveInputBase(excnYmd);
        if (base == null) throw new IllegalStateException("해당 일자의 CAST 기본 입력 리소스 설정이 없습니다.");
        for (String required : new String[] { base.getMdlRsrcId(), base.getPrptSetRsrcId(), base.getCknctSrvcHrRsrcId(), base.getChknTypeRsrcId(), base.getFcltyOpngImmiRsrcId(), base.getFcltyOpngTrScrtyCntrlRsrcId() }) {
            if (required == null || required.isBlank()) throw new IllegalStateException("모델·PropertySet·서비스시간·체크인유형·입국심사·환승보안 기본 설정을 확인해주세요.");
        }
        if (!base.getPrptSetRsrcId().matches(PS + "[0-9]{3}")) throw new IllegalStateException("기본 PropertySet ID 형식이 올바르지 않습니다: " + base.getPrptSetRsrcId());
        int sourcePsNo = Integer.parseInt(base.getPrptSetRsrcId().substring(2));
        if (sourcePsNo >= 500 && sourcePsNo <= 998) throw new IllegalStateException("기본 PropertySet은 사용자 실행 예약 범위를 사용할 수 없습니다.");
        UserSmltRsrcSnapshotDto snapshot = getSnapshot(smltId, excnYmd, base);
        for (UserSmltFrozenDto frozen : frozenList) addRows(snapshot, frozen);

        publishRsrc(RsrcTable.FLT_SCHDL, snapshot, this::insertSchdlAtrb);
        publishRsrc(RsrcTable.CKNCT, snapshot, castUserSnapshotMapper::insertCknctAtrb);
        publishRsrc(RsrcTable.SBD, snapshot, this::insertSbdAtrb);
        publishRsrc(RsrcTable.DPTGT, snapshot, castUserSnapshotMapper::insertDptgtAtrb);
        publishRsrc(RsrcTable.SCRTY_CNTRL, snapshot, castUserSnapshotMapper::insertScrtyCntrlAtrb);
        publishRsrc(RsrcTable.ENTCNY, snapshot, castUserSnapshotMapper::insertEntcnyAtrb);
        publishRsrc(RsrcTable.TRNST_SCRTY_CNTRL, snapshot, castUserSnapshotMapper::insertTrnstScrtyCntrlAtrb);

        for (String[] resource : List.of(
                new String[] { "FlightSchedule", snapshot.getFltSchdlRsrcId() },
                new String[] { "CounterAllocation", snapshot.getCknctAlctnRsrcId() },
                new String[] { "CounterAllocation", snapshot.getSbdCntrlAlctnId() },
                new String[] { "GenericTable", snapshot.getFcltyOpngDptcnySrngRsrcId() },
                new String[] { "GenericTable", snapshot.getFcltyOpngScrtyCntrlRsrcId() },
                new String[] { "GenericTable", snapshot.getFcltyOpngEntcnyRsrcId() },
                new String[] { "GenericTable", snapshot.getFcltyOpngTrScrtyCntrlRsrcId() },
                new String[] { "GenericTable", snapshot.getFcltyOpngDptcnyRsrcId() },
                new String[] { "GenericTable", snapshot.getRptStngAtrbId() },
                new String[] { "CASTModel", snapshot.getMdlRsrcId() },
                new String[] { "PropertySet", base.getPrptSetRsrcId() },
                new String[] { "GenericTable", snapshot.getCknctSrvcHrRsrcId() },
                new String[] { "GenericTable", snapshot.getChknTypeRsrcId() })) {
            if (resource[1] != null && !resource[1].isBlank()) capture(snapshot, resource[0], resource[1]);
        }
        return snapshot;
    }

    private String capture(UserSmltRsrcSnapshotDto snapshot, String type, String id) {
        if (id.length() > 100) throw new IllegalStateException("CAST 입력 리소스 ID가 100자를 초과합니다.");
        String xml = castRestService.captureResource(type, id, snapshot.getExcnYmd());
        if (xml == null || !xml.contains("ResourceInfo")) throw new IllegalStateException("CAST 입력 리소스가 없습니다: " + id);
        return xml;
    }

    private UserSmltRsrcSnapshotDto getSnapshot(String smltId, String excnYmd, SmltStngDto base) {
        UserSmltRsrcSnapshotDto result = new UserSmltRsrcSnapshotDto();
        SessionUtils.setUserContext(result, sessionService);

        executionService.lock();
        String rsrcNo = reserve(RsrcPool.FS);
        String psNo = reserve(RsrcPool.PS);

        result.setRsrcNo(rsrcNo);
        result.setSmltId(smltId);
        result.setExcnYmd(excnYmd);

        result.setFltSchdlRsrcId(FS + rsrcNo);
        result.setCknctAlctnRsrcId(CA + rsrcNo);
        result.setSbdCntrlAlctnId(SBD + rsrcNo);
        result.setFcltyOpngDptcnySrngRsrcId(DEPARTURE_GATE + rsrcNo);
        result.setFcltyOpngScrtyCntrlRsrcId(SECURITY_CONTROL + rsrcNo);
        result.setFcltyOpngEntcnyRsrcId(IMMIGRATION + rsrcNo);
        result.setFcltyOpngTrScrtyCntrlRsrcId(TRANSFER_SECURITY_CONTROL + rsrcNo);
        result.setPrptStngRsrcId(PS + psNo);

        result.setSrcPrptSetRsrcId(base.getPrptSetRsrcId());
        result.setMdlRsrcId(base.getMdlRsrcId());
        result.setCknctSrvcHrRsrcId(base.getCknctSrvcHrRsrcId());
        result.setChknTypeRsrcId(base.getChknTypeRsrcId());
        result.setRptStngAtrbId(base.getRptStngAtrbId());
        result.setFcltyOpngDptcnyRsrcId(base.getFcltyOpngEmiRsrcId());

        result.setSrcFltSchdlRsrcId(DAILY_FLT_SCHDL_RSRC_ID);
        result.setSrcFcltyOpngEntcnyRsrcId(base.getFcltyOpngImmiRsrcId());
        result.setSrcFcltyOpngTrScrtyCntrlRsrcId(base.getFcltyOpngTrScrtyCntrlRsrcId());

        return result;
    }

    private String reserve(RsrcPool pool) {
        String no = executionMapper.reserveRsrcNo(pool.name(), pool.minNo, pool.maxNo);
        if (no == null) throw new IllegalStateException(pool.name() + " 리소스 번호를 모두 사용했습니다. 기존 번호는 재사용하지 않습니다.");
        if (executionMapper.updateLastRsrcNo(pool.name(), no) != 1) throw new IllegalStateException(pool.name() + " 리소스 번호 채번 행이 없습니다.");
        return no;
    }

    private void addRows(UserSmltRsrcSnapshotDto snapshot, UserSmltFrozenDto frozen) {
        String tmnlId = frozen.getTmnlId().getFcltTmnlId();
        snapshot.getFltAjmtList().add(new FltAjmtRow(tmnlId, frozen.getFlt().getAjmtRt()));
        for (ChknIslandDto island : list(frozen.getChkn().getIslandList())) {
            snapshot.getChknIslList().add(new ChknIslRow(tmnlId, island.getIsland(), island.getKioskCnt(), island.getBagDropCnt()));
            addOperHrRows(snapshot.getChknOperHrList(), tmnlId, island.getIsland(), island.getOprTimeList());
            for (ChknBoothDto booth : list(island.getBoothList())) {
                if (booth.getAlnCd() == null || booth.getAlnCd().isBlank()) continue;
                snapshot.getChknBoothList().add(new ChknBoothRow(tmnlId, island.getIsland(), booth.getBoothNo(), booth.getAlnCd()));
            }
        }
        for (DepGateDto gate : list(frozen.getDep().getDptgtList())) {
            snapshot.getDptgtList().add(new DptgtRow(tmnlId, gate.getDptgtNo(), gate.getOprYn(), gate.getScshCntom(), gate.getGnrlSrchCntom(), gate.getSmartPassSrchCntom()));
            addOperHrRows(snapshot.getDptgtOperHrList(), tmnlId, gate.getDptgtNo(), gate.getOprTimeList());
        }
    }

    private void addOperHrRows(List<OperHrRow> rows, String tmnlId, String fcltCd, List<OprTimeDto> oprTimeList) {
        List<OprTimeDto> values = list(oprTimeList);
        for (int i = 0; i < values.size(); i++) {
            rows.add(new OperHrRow(tmnlId, fcltCd, i + 1, values.get(i).getOperBgngHour(), values.get(i).getOperEndHour()));
        }
    }

    private <T> List<T> list(List<T> values) { return values == null ? List.of() : values; }

    private void publishRsrc(
            RsrcTable table,
            UserSmltRsrcSnapshotDto snapshot,
            Consumer<UserSmltRsrcSnapshotDto> insertAtrb
    ) {
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
                "TN_PM_SMLT_FCLTY_OPNG_SCRTY_CNTRL_ATRB", "SCRTY_CNTRL_ATRB_ID"),
        ENTCNY(
                "TN_PM_SMLT_FCLTY_OPNG_ENTCNY_MSTR", "ENTCNY_ATRB_ID", "ENTCNY_ATRB_NM",
                "TN_PM_SMLT_FCLTY_OPNG_ENTCNY_ATRB", "ENTCNY_ATRB_ID"),
        TRNST_SCRTY_CNTRL(
                "TN_PM_SMLT_FCLTY_OPNG_TRNST_SCRTY_CNTRL_MSTR", "TRNST_SCRTY_CNTRL_ATRB_ID", "TRNST_SCRTY_CNTRL_ATRB_NM",
                "TN_PM_SMLT_FCLTY_OPNG_TRNST_SCRTY_CNTRL_ATRB", "TRNST_SCRTY_CNTRL_ATRB_ID");

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

    // 001 기준정보 · 002~499 Cast 설정 카테고리 · 999 전처리 결과와 겹치지 않게 PS 는 500~998 만 쓴다
    private enum RsrcPool {
        FS(2, 999),
        PS(500, 998);

        private final int minNo;
        private final int maxNo;

        RsrcPool(int minNo, int maxNo) {
            this.minNo = minNo;
            this.maxNo = maxNo;
        }
    }
}
