package aoms.pm.cast.service;

import aoms.pm.cast.dto.MntrSearchDto;
import aoms.pm.cast.dto.SmltExecDetailDto;
import aoms.pm.cast.dto.SmltExecListDto;
import aoms.pm.cast.dto.SmltExecSmryDto;

/**
 * @Classname : CastMntrService.java
 * @Description : 시뮬레이션 모니터링 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 원천은 {@code PMOWN.TH_PM_SMLT_FLFMT_HSTRY} 다 — {@code executeUserSmlt} 가 쓰는 이력 테이블과 같은 곳이다.
 * 구현체가 둘이며 {@code pm.cast.data-source} 플래그로 하나만 등록된다.
 */
public interface CastMntrService {
	/** 상단 KPI 카드 4종 (전체 수행 / 완료 / 진행중 / 평균 수행시간) */
	SmltExecSmryDto retrieveSmltExecSmry(MntrSearchDto searchDto);

	/** 시뮬레이션 이력 — 표준 / 사용자를 한 번에 내려준다 */
	SmltExecListDto retrieveSmltExecList(MntrSearchDto searchDto);

	/** 이력 1건 결과 보기 */
	SmltExecDetailDto retrieveSmltExecDetail(MntrSearchDto searchDto);
}
