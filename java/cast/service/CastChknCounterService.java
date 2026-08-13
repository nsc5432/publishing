package aoms.pm.cast.service;

import aoms.pm.cast.dto.ChknCounterDto;
import aoms.pm.cast.dto.ChknCounterSearchDto;

/**
 * @Classname : CastChknCounterService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 체크인카운터 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 14. / 노세찬 / 최초작성 (구 체크인카운터 · 셀프체크인/백드롭 메뉴 통합)
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 화면의 차트 · 표 두 보기가 {@code retrieveChknCounter} 한 건을 나눠 쓴다.
 * 사용자 시뮬레이션의 체크인 카운터 탭({@link CastChknService})과 대상 시설은 같지만
 * 이쪽은 <b>결과 조회</b>다 — 저장분을 보지 않고 그날 배정정보와 시뮬레이션 결과만 읽는다.
 */
public interface CastChknCounterService {
	/**
	 * 화면 하루치 (요약 · 결과 지표 · 시간대별 자원 · 30분 슬롯).
	 * 자원 활용 차트도 이 응답에서 나오므로 화면은 터미널이 바뀔 때만 부른다.
	 */
	ChknCounterDto retrieveChknCounter(ChknCounterSearchDto searchDto);
}
