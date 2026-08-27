package aoms.pm.cast.service.impl;

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

		publishFltSchdl(snapshot);
		publishCknct(snapshot);
		publishSbd(snapshot);
		publishDptgt(snapshot);
		publishScrtyCntrl(snapshot);

		return snapshot;
	}

	/* ================= 내부 ================= */

	private UserSmltRsrcSnapshotDto getSnapshot(String smltId, TerminalKind tmnlId, String excnYmd, SmltStngDto dailyStng) {
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

	private void publishFltSchdl(UserSmltRsrcSnapshotDto snapshot) {
		castUserSnapshotMapper.deleteSchdlAtrb(snapshot.getRsrcNo());
		castUserSnapshotMapper.deleteSchdlMstr(snapshot.getRsrcNo());
		castUserSnapshotMapper.insertSchdlMstr(snapshot);

		// 일일이 운영계를 직접 읽는 FS001 이면 운영계에서, 이미 스케줄 리소스면 그걸 복사한다
		if (isDailyOperative(snapshot.getSrcFltSchdlRsrcId())) {
			castUserSnapshotMapper.insertSchdlAtrbFromDaily(snapshot);
			return;
		}

		castUserSnapshotMapper.insertSchdlAtrbFromSrc(snapshot);
	}

	private void publishCknct(UserSmltRsrcSnapshotDto snapshot) {
		castUserSnapshotMapper.deleteCknctAtrb(snapshot.getRsrcNo());
		castUserSnapshotMapper.deleteCknctMstr(snapshot.getRsrcNo());
		castUserSnapshotMapper.insertCknctMstr(snapshot);
		castUserSnapshotMapper.insertCknctAtrb(snapshot);
	}

	private void publishSbd(UserSmltRsrcSnapshotDto snapshot) {
		castUserSnapshotMapper.deleteSbdAtrb(snapshot.getRsrcNo());
		castUserSnapshotMapper.deleteSbdMstr(snapshot.getRsrcNo());
		castUserSnapshotMapper.insertSbdMstr(snapshot);
		castUserSnapshotMapper.insertSbdAtrb(snapshot);
	}

	private void publishDptgt(UserSmltRsrcSnapshotDto snapshot) {
		castUserSnapshotMapper.deleteDptgtAtrb(snapshot.getRsrcNo());
		castUserSnapshotMapper.deleteDptgtMstr(snapshot.getRsrcNo());
		castUserSnapshotMapper.insertDptgtMstr(snapshot);
		castUserSnapshotMapper.insertDptgtAtrb(snapshot);
	}

	private void publishScrtyCntrl(UserSmltRsrcSnapshotDto snapshot) {
		castUserSnapshotMapper.deleteScrtyCntrlAtrb(snapshot.getRsrcNo());
		castUserSnapshotMapper.deleteScrtyCntrlMstr(snapshot.getRsrcNo());
		castUserSnapshotMapper.insertScrtyCntrlMstr(snapshot);
		castUserSnapshotMapper.insertScrtyCntrlAtrb(snapshot);
	}

	private boolean isDailyOperative(String srcFltSchdlRsrcId) {
		return srcFltSchdlRsrcId == null || srcFltSchdlRsrcId.isEmpty()
				|| DAILY_FLT_SCHDL_RSRC_ID.equals(srcFltSchdlRsrcId);
	}
}
