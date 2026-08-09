package aoms.pm.cast.service;

import aoms.pm.cast.dto.UserSmltExecDto;
import aoms.pm.cast.dto.UserSmltExecSearchDto;
import aoms.pm.cast.dto.UserSmltFcltMapDto;
import aoms.pm.cast.dto.UserSmltFcltMapSearchDto;
import aoms.pm.cast.dto.UserSmltInfoDto;
import aoms.pm.cast.dto.UserSmltInfoSearchDto;

/**
 * @Classname : CastUserSmltService.java
 * @Description : 사용자 시뮬레이션 진입 · 지도 보기 · 수행 Service
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
 * 탭 3개의 조회·저장은 {@link CastFltPsgService} · {@link CastChknService} · {@link CastDepService} 가 갖고 있다.
 * 여기 있는 것은 <b>탭에 걸리지 않는 3개</b>다 — 진입 정보 · 지도 보기 · 수행.
 * 구현체가 둘이며 {@code pm.cast.data-source} 플래그로 하나만 등록된다.
 */
public interface CastUserSmltService {
	/** 조건 설정 진입 정보 — 터미널을 고른 뒤 부른다 */
	UserSmltInfoDto retrieveUserSmltInfo(UserSmltInfoSearchDto searchDto);

	/** 요약 바의 지도 보기 — 시설 배치 마커 */
	UserSmltFcltMapDto retrieveFcltMap(UserSmltFcltMapSearchDto searchDto);

	/** 시뮬레이션 실행 — 비동기로 시작만 걸고 진행 상황은 모니터링 화면이 폴링한다 */
	UserSmltExecDto executeUserSmlt(UserSmltExecSearchDto searchDto);
}
