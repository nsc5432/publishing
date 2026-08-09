package aoms.pm.cast.service;

import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.DepHallTrendDto;

/**
 * @Classname : CastDepHallService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 출국장 Service
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
 * 화면의 맵 · 표 보기는 {@code retrieveDepHall} 한 건을 나눠 쓰고, 차트 보기만
 * {@code retrieveDepHallTrend} 를 따로 부른다.
 */
public interface CastDepHallService {
	/** 화면 본문 (혼잡 알림 · 출국장 카드 · 마커) — 타임라인을 옮길 때마다 재호출된다 */
	DepHallDto retrieveDepHall(DepHallSearchDto searchDto);

	/** 차트 보기 — 출국장별 하루 추이 (터미널이 바뀔 때만 재호출된다) */
	DepHallTrendDto retrieveDepHallTrend(DepHallSearchDto searchDto);
}
