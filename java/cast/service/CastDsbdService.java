package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
import aoms.pm.cast.dto.DsbdRsltDto;
import aoms.pm.cast.dto.DsbdSearchDto;
import aoms.pm.cast.dto.TmnlSmryDto;

/**
 * @Classname : CastDsbdService.java
 * @Description : 일일 시뮬레이션 결과 조회 - 요약보기(대시보드) Service
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
public interface CastDsbdService {
	/** 조회 조건 기준 정보 — 화면 진입 시 가장 먼저 호출된다 */
	DsbdBaseInfoDto retrieveDailySmltBaseInfo(DsbdSearchDto searchDto);

	/** 상단 카드 4종 (운항계획 · 시간대별 출발여객 · 요일 속성 · 기상정보) */
	DsbdHeaderDto retrieveDailySmltHeader(DsbdSearchDto searchDto);

	/** 터미널 패널 요약 (운항/여객 증감 · 탑승률 · 피크시간) */
	TmnlSmryDto retrieveDailySmltTmnlSmry(DsbdSearchDto searchDto);

	/** 시간대별 결과 — 차트 뷰와 테이블 뷰가 함께 쓴다 */
	List<DsbdRsltDto> retrieveDailySmltTmnlRsltByTime(DsbdSearchDto searchDto);

	/** 게이트 카드 (체크인카운터 / 출국장 캐러셀) */
	List<DsbdFcltCardDto> retrieveDailySmltFcltCard(DsbdSearchDto searchDto);
}
