package aoms.pm.cast.service;

import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;

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
 * 화면의 맵 · 표 · 차트 세 보기가 {@code retrieveDepHall} 한 건을 나눠 쓴다.
 */
public interface CastDepHallService {
	/**
	 * 화면 하루치 (혼잡 알림 · 출국장 카드 · 마커 · 30분 슬롯).
	 * 차트 보기의 추이도 이 슬롯을 훑어 그리므로 화면은 터미널이 바뀔 때만 부른다.
	 */
	DepHallDto retrieveDepHall(DepHallSearchDto searchDto);
}
