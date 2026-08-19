package aoms.pm.cast.service;

import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.UserConfigChknDto;

/**
 * @Classname : CastUserConfigService.java
 * @Description : Cast 사용자 설정 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastUserConfigService {
	/** 체크인 카운터 탭(retrieveChknCounterInfo)의 부스 배정 입력이다. 자체 엔드포인트는 없다 */
	Map<String, List<UserConfigChknDto>> retrieveChknMapGroupByIsland(String ymd, String tmnlId);
}
