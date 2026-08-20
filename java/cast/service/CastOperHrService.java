package aoms.pm.cast.service;

import java.util.List;
import java.util.Map;

import aoms.pm.cast.dto.DepOperHrRawDto;

/**
 * @Classname : CastOperHrService.java
 * @Description : Cast 실운영 운영시간 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 20. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 입출국장 운영시간 3테이블(TN_PM_ENTGT_DPTGT_OPER_HR_INFO · _ELMNT · _MNG)은 운영시간 관리
 * 화면(aoms.pm.adtoper)이 소유한다. 조회 규칙(배포완료 차수 선택 · 논리삭제 제외 · 기간 판정)이
 * 그쪽 쿼리에 들어 있어 Cast 는 그 mapper 를 그대로 재사용하고, 의존은 이 서비스 한 곳에 가둔다.
 */
public interface CastOperHrService {
	Map<String, List<DepOperHrRawDto>> retrieveDepOperHrMap(String fcltTmnlId, String ymd);
}
