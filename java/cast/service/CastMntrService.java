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
 */
public interface CastMntrService {
	SmltExecSmryDto retrieveSmltExecSmry(MntrSearchDto searchDto);

	SmltExecListDto retrieveSmltExecList(MntrSearchDto searchDto);

	SmltExecDetailDto retrieveSmltExecDetail(MntrSearchDto searchDto);
}
