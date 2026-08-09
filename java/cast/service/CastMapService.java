package aoms.pm.cast.service;

import aoms.pm.cast.dto.MapChknDetailDto;
import aoms.pm.cast.dto.MapDepDetailDto;
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
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 구현체가 둘이다. {@code pm.cast.data-source} 플래그로 하나만 등록된다
 * ({@link aoms.pm.cast.config.CastApiMode} 참고).
 */
public interface CastMapService {
	/** 도면 본문 (혼잡 알림 · 운영시간 카드 · 마커) — 타임라인을 옮길 때마다 재호출된다 */
	SmltMapDto retrieveSmltMap(MapSearchDto searchDto);

	/** 아일랜드 마커 클릭 — 상세 팝업 */
	MapChknDetailDto retrieveSmltMapChknDetail(MapSearchDto searchDto);

	/** 출국장 마커 클릭 — 미니 팝업 */
	MapDepDetailDto retrieveSmltMapDepDetail(MapSearchDto searchDto);
}
