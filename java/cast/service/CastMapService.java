package aoms.pm.cast.service;

import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.SmltMapDto;

/**
 * @Classname : CastMapService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 맵형태보기 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 09. / 노세찬 / 최초작성
 * 2026. 08. 12. / 노세찬 / 하루치 일괄 조회로 변경 (타임라인 재조회 제거)
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 구현체가 둘이다. {@code pm.cast.data-source} 플래그로 하나만 등록된다
 * ({@link aoms.pm.cast.config.CastApiMode} 참고).
 */
public interface CastMapService {
	/**
	 * 도면 하루치 (혼잡 알림 · 운영시간 카드 · 마커 · 30분 슬롯).
	 * 마커 상세 팝업 값까지 슬롯에 담아 내려주므로 화면은 터미널이 바뀔 때만 부른다.
	 */
	SmltMapDto retrieveSmltMap(MapSearchDto searchDto);
}
