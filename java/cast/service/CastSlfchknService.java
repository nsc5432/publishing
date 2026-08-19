package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.SlfDeviceCntRawDto;

/**
 * @Classname : CastSlfchknService.java
 * @Description : Cast 셀프체크인 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 *                          셀프체크인/백드랍은 체크인 카운터 탭에 흡수됐고(DELTA 1.2),
 *                          그 화면이 쓰는 기기 대수 조회만 남는다
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastSlfchknService {
	List<SlfDeviceCntRawDto> retrieveSlfDeviceCntList(String tmnlId);
}
