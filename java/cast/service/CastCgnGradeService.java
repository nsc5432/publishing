package aoms.pm.cast.service;

import aoms.pm.cast.domains.CgnGradeScale;
import aoms.pm.cast.enums.FcltType;

/**
 * @Classname : CastCgnGradeService.java
 * @Description : 혼잡등급 기준정보 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 09. 04. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public interface CastCgnGradeService {
	CgnGradeScale retrieveGradeScale(FcltType fcltType, String context);
}
