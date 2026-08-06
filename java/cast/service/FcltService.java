package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.FcltDto;

/**
 * @Classname : FcltService.java
 * @Description : 시설물 관리 Service
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
public interface FcltService {
	List<FcltDto> retrieveFcltList(String tmnlId);

	void updatePosition(FcltDto dto);
}
