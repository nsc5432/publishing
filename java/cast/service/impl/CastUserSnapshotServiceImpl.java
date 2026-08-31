package aoms.pm.cast.service.impl;

import java.util.function.Consumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserFltPsgRawDto;
import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;
import aoms.pm.cast.enums.AdjType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFltPsgMapper;
import aoms.pm.cast.mapper.CastUserSnapshotMapper;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.cast.service.CastUserSnapshotService;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastUserSnapshotServiceImpl.java
 * @Description : 사용자 조건 → CAST 입력 리소스 snapshot 발행 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 27. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
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
	private final CastFltPsgMapper castFltPsgMapper;
	private final CastSmltService castSmltService;
	private final SessionService sessionService;

	@Override
	public UserSmltRsrcSnapshotDto publish(String smltId, TerminalKind tmnlId, String excnYmd) {
		SmltStngDto dailyStng = castSmltService.retrieveSmltStngByKey(smltId);
		UserSmltRsrcSnapshotDto snapshot = getSnapshot(smltId, tmnlId, excnYmd, dailyStng);

		publishRsrc(RsrcTable.FLT_SCHDL, snapshot, this::insertSchdlAtrb);
		publishRsrc(RsrcTable.CKNCT, snapshot, castUserSnapshotMapper::insertCknctAtrb);
		publishRsrc(RsrcTable.SBD, snapshot, this::insertSbdAtrb);
		publishRsrc(RsrcTable.DPTGT, snapshot, castUserSnapshotMapper::insertDptgtAtrb);
		publishRsrc(RsrcTable.SCRTY_CNTRL, snapshot, castUserSnapshotMapper::insertScrtyCntrlAtrb);

		return snapshot;
	}

	private UserSmltRsrcSnapshotDto getSnapshot(
			String smltId,
			TerminalKind tmnlId,
			String excnYmd,
			SmltStngDto dailyStng
	) {
		UserSmltRsrcSnapshotDto result = new UserSmltRsrcSnapshotDto();
		SessionUtils.setUserContext(result, sessionService);

		String rsrcNo = castUserSnapshotMapper.retrieveNextRsrcNo();
		UserFltPsgRawDto ajmt = castFltPsgMapper.retrieveUserFltPsg(smltId, tmnlId.getFcltTmnlId());

		result.setRsrcNo(rsrcNo);
		result.setSmltId(smltId);
		result.setTmnlId(tmnlId.getFcltTmnlId());
		result.setFltTmnlIdList(tmnlId.getFltTmnlIdList());
		result.setExcnYmd(excnYmd);

		result.setFltSchdlRsrcId(FS + rsrcNo);
		result.setCknctAlctnRsrcId(CA + rsrcNo);
		result.setSbdCntrlAlctnId(SBD + rsrcNo);
		result.setFcltyOpngDptcnySrngRsrcId(DEPARTURE_GATE + rsrcNo);
		result.setFcltyOpngScrtyCntrlRsrcId(SECURITY_CONTROL + rsrcNo);

		// 사용자가 편집하지 않는 축은 새로 발행하지 않고 일일 설정의 리소스를 그대로 가리킨다
		result.setMdlRsrcId(dailyStng.getMdlRsrcId());
		result.setPrptStngRsrcId(dailyStng.getPrptSetRsrcId());
		result.setCknctSrvcHrRsrcId(dailyStng.getCknctSrvcHrRsrcId());
		result.setChknTypeRsrcId(dailyStng.getChknTypeRsrcId());
		result.setFcltyOpngDptcnyRsrcId(dailyStng.getFcltyOpngEmiRsrcId());
		result.setFcltyOpngEntcnyRsrcId(dailyStng.getFcltyOpngImmiRsrcId());
		result.setFcltyOpngTrScrtyCntrlRsrcId(dailyStng.getFcltyOpngTrScrtyCntrlRsrcId());

		result.setSrcFltSchdlRsrcId(dailyStng.getFltSchdlRsrcId());
		result.setAjmtTypeCd(ajmt != null ? ajmt.getAjmtTypeCd() : AdjType.RATIO.getValue());
		result.setAjmtRt(ajmt != null ? ajmt.getAjmtRt() : 0);

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
		// 일일이 운영계를 직접 읽는 FS001 이면 운영계에서, 이미 스케줄 리소스면 그걸 복사한다
		if (isDailyOperative(snapshot.getSrcFltSchdlRsrcId())) {
			castUserSnapshotMapper.insertSchdlAtrbFromDaily(snapshot);
			return;
		}

		castUserSnapshotMapper.insertSchdlAtrbFromSrc(snapshot);
	}

	private void insertSbdAtrb(UserSmltRsrcSnapshotDto snapshot) {
		// 한 리소스 안에 백드롭과 키오스크가 BLCK_ID 로 나뉘어 들어간다
		castUserSnapshotMapper.insertSbdAtrb(snapshot);
		castUserSnapshotMapper.insertSbdAtrbKiosk(snapshot);
	}

	private boolean isDailyOperative(String srcFltSchdlRsrcId) {
		return srcFltSchdlRsrcId == null || srcFltSchdlRsrcId.isEmpty()
				|| DAILY_FLT_SCHDL_RSRC_ID.equals(srcFltSchdlRsrcId);
	}

	/**
	 * 리소스별 마스터·속성 테이블. 다섯 리소스가 같은 삭제·마스터 INSERT 문장을 쓰므로
	 * 달라지는 테이블·컬럼명만 여기 모은다.
	 */
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
