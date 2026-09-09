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
	/*
	 * 실행 시점의 draft 를 CAST 리소스로 굳힌다. 이후 draft 가 바뀌어도 발행분은 변하지 않는다.
	 * 한 리소스 세트에 T1·T2 draft 가 함께 들어간다 — CAST 는 공항 전체를 한 번에 돌린다.
	 * 호출자(실행 등록)의 트랜잭션에 참여하므로 등록이 실패하면 발행분도 함께 롤백된다.
	 */
	UserSmltRsrcSnapshotDto publish(String smltId, String excnYmd);
}
