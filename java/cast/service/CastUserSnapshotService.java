package aoms.pm.cast.service;

import aoms.pm.cast.dto.UserSmltRsrcSnapshotDto;

/**
 * @Classname : CastUserSnapshotService.java
 * @Description : 사용자 조건 → CAST 입력 리소스 snapshot 발행 Service
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
public interface CastUserSnapshotService {
	UserSmltRsrcSnapshotDto publish(String smltId, String excnYmd);
}
