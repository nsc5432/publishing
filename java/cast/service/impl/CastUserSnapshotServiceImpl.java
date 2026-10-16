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
import aoms.pm.cast.dto.UserSmltFrozenDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.ChknBoothRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.ChknIslRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.DptgtRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.FltAjmtRow;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto.OperHrRow;
import aoms.pm.cast.mapper.CastExecutionMapper;
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

    // 사용자 결과를 일일 결과와 KPI 비교하므로 편집하지 않는 리소스는 일일 시뮬레이션과 같은 001 원천을 쓴다
    private static final String DAILY_RSRC_NO = "001";
    private static final String MDL_RSRC_ID = "ICN001";
    private static final String DAILY_PRPT_SET_RSRC_ID = PS + DAILY_RSRC_NO;
    private static final String DAILY_CKNCT_SRVC_HR_RSRC_ID = "CheckinCounterServiceTime" + DAILY_RSRC_NO;
    private static final String DAILY_CHKN_TYPE_RSRC_ID = "CheckinType" + DAILY_RSRC_NO;
    private static final String DAILY_EMIGRATION_RSRC_ID = "FacilityOpeningTable_Emigration" + DAILY_RSRC_NO;
    private static final String DAILY_RPT_STNG_ATRB_ID = "ReportingProfilesTimeGroups" + DAILY_RSRC_NO;

    private final CastUserSnapshotMapper castUserSnapshotMapper;
    private final SessionService sessionService;
    private final CastExecutionMapper executionMapper;

    @Override
    public UserSmltRsrcSnapshotDto publish(String smltId, String excnYmd, List<UserSmltFrozenDto> frozenList) {
        UserSmltRsrcSnapshotDto snapshot = getSnapshot(smltId, excnYmd);
        for (UserSmltFrozenDto frozen : frozenList) addRows(snapshot, frozen);

        publishRsrc(RsrcTable.FLT_SCHDL, snapshot, this::insertSchdlAtrb);
        publishRsrc(RsrcTable.CKNCT, snapshot, castUserSnapshotMapper::insertCknctAtrb);
        publishRsrc(RsrcTable.SBD, snapshot, this::insertSbdAtrb);
        publishRsrc(RsrcTable.DPTGT, snapshot, castUserSnapshotMapper::insertDptgtAtrb);
        publishRsrc(RsrcTable.SCRTY_CNTRL, snapshot, castUserSnapshotMapper::insertScrtyCntrlAtrb);
        publishRsrc(RsrcTable.ENTCNY, snapshot, castUserSnapshotMapper::insertEntcnyAtrb);
        publishRsrc(RsrcTable.TRNST_SCRTY_CNTRL, snapshot, castUserSnapshotMapper::insertTrnstScrtyCntrlAtrb);

        return snapshot;
    }

    private UserSmltRsrcSnapshotDto getSnapshot(String smltId, String excnYmd) {
        UserSmltRsrcSnapshotDto result = new UserSmltRsrcSnapshotDto();
        SessionUtils.setUserContext(result, sessionService);

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

        result.setSrcPrptSetRsrcId(DAILY_PRPT_SET_RSRC_ID);
        result.setMdlRsrcId(MDL_RSRC_ID);
        result.setCknctSrvcHrRsrcId(DAILY_CKNCT_SRVC_HR_RSRC_ID);
        result.setChknTypeRsrcId(DAILY_CHKN_TYPE_RSRC_ID);
        result.setRptStngAtrbId(DAILY_RPT_STNG_ATRB_ID);
        result.setFcltyOpngDptcnyRsrcId(DAILY_EMIGRATION_RSRC_ID);

        result.setSrcFltSchdlRsrcId(DAILY_FLT_SCHDL_RSRC_ID);
        result.setSrcFcltyOpngEntcnyRsrcId(IMMIGRATION + DAILY_RSRC_NO);
        result.setSrcFcltyOpngTrScrtyCntrlRsrcId(TRANSFER_SECURITY_CONTROL + DAILY_RSRC_NO);

        return result;
    }

    private String reserve(RsrcPool pool) {
        String no = executionMapper.reserveRsrcNo(pool.name(), pool.minNo, pool.maxNo);
        if (no == null) throw new IllegalStateException(pool.name() + " 리소스 번호를 모두 사용했습니다. 오래된 실행을 정리한 뒤 다시 실행해주세요.");
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
