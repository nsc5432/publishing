package aoms.pm.cast.service;

/**
 * @Classname : CastRsrcService.java
 * @Description : CAST 리소스 발행 Service — 연동 호출 지점
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 08. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastRsrcService {
	/**
	 * 저장된 사용자 조건을 CAST 시뮬레이션 엔진의 리소스로 발행한다.
	 * 발행 순서와 대상은 구현체의 상수 목록에 고정되어 있다.
	 */
	void publishUserSmltRsrc(String smltId, String tmnlId);

	/** 발행된 리소스로 수행을 시작한다. 완료를 기다리지 않는다. */
	void triggerUserSmltExcn(String smltId, String tmnlId, int smltExcnSn);
}
