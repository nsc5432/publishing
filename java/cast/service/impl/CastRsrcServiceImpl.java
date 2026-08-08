package aoms.pm.cast.service.impl;

import org.springframework.stereotype.Service;

import aoms.pm.cast.service.CastRsrcService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastRsrcServiceImpl.java
 * @Description : CAST 리소스 발행 ServiceImpl — 연동 호출 지점
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
/*
 * 이 클래스는 호출 지점과 순서만 확보한 것이고 실제 발행은 아직 하지 않는다.
 *
 * 막혀 있는 이유 (2단계 G8)
 *   CastRestMapper.xml (namespace aoms.pm.castrest.mapper.CastRestMapper) 의 49개 statement 중
 *   45개가 aoms.pm.cmmn.dto.* 를 parameterType / resultType 으로 쓰는데,
 *   그 패키지의 Java 소스가 이 레포에 없다. 매퍼 인터페이스를 선언할 수 없으므로
 *   발행 SQL 을 호출할 수단 자체가 없다.
 *
 * 발행 순서는 publishUserSmltRsrc 위 주석에 적었다. CastRestMapper.xml 의 리소스 발행
 * 쿼리 배치와 TN_PM_SMLT_STNG 의 *_RSRC_ID 참조 관계에서 나온 것이다.
 */
@Service
@RequiredArgsConstructor
public class CastRsrcServiceImpl implements CastRsrcService {
	/*
	 * 발행 호출 지점. 원본 소스를 확보하면 아래 순서 그대로 CastRestMapper 를 호출한다.
	 * 앞 단계의 리소스 ID 가 뒤 단계의 입력이 되므로 순서를 바꾸면 안 된다.
	 *
	 *   1. 운항 스케줄      retrieveFlightSchedule (CastRestMapper.xml:226) → TN_PM_SMLT_SCHDL_MSTR/ATRB
	 *                       — TN_PM_SMLT_USER_FLT_PSG 의 조정 비율을 여기서 곱한다
	 *   2. 카운터 배정      retrieveCounterAllocation (:867)               → TN_PM_SMLT_CKNCT_MSTR/ATRB
	 *                       — TN_PM_SMLT_USER_CHKN_BOOTH / _OPER_HR 를 입력으로 쓴다
	 *   3. 셀프백드랍 배정  retrieveSelfCheckInCountAndBagDrop (:1157)     → TN_PM_SMLT_SBD_MSTR/ATRB
	 *   4. 프로퍼티 셋      retrievePropertySet 계열 (:1250~)              → TN_PM_SMLT_FIX_ATRB_GROUP 외 5
	 *   5. 모델             retrieveModelInfo (:1539)                      → TN_PM_SMLT_MDL
	 *   6. 시설 개방 테이블 retrieveFcltyOpngTblDptg (:1938) 외 4종        → ..._OPNG_TBL_*_ATRB
	 *                       — TN_PM_SMLT_USER_DEP / _OPER_HR / TN_PM_SMLT_SC_PLAN 을 입력으로 쓴다
	 *   7. What-If 정의     retrieveWhatIfCntrl (:2208)                    → TN_PM_SMLT_WHAT_IF_DEF_TBL
	 *   8. 시뮬레이션 설정  insertSimSet (:1570)                           → TN_PM_SMLT_STNG
	 */
	@Override
	public void publishUserSmltRsrc(String smltId, String tmnlId) {
		// G8 해소 전까지 비워 둔다. 호출 순서는 위 주석이 정본이다
	}

	@Override
	public void triggerUserSmltExcn(String smltId, String tmnlId, int smltExcnSn) {
		// 수행 시작 트리거 지점. 동기적으로 완료를 기다리지 않는다 (지시서 5.6).
		// 트리거 프로토콜(REST 엔드포인트 / 큐)이 확인되지 않아 비워 둔다
	}
}
