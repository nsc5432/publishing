package aoms.pm.cast.service;

import aoms.pm.cast.dto.FcltMapListDto;
import aoms.pm.cast.dto.FcltMapSaveDto;
import aoms.pm.cast.dto.FcltMapSearchDto;
import aoms.pm.cast.dto.JsonResponse;

/**
 * @Classname : CastFcltService.java
 * @Description : 시설물 매핑 Service
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 *
 * 여객시설(TN_PM_SMLT_PSG_FCLT)과 CAST 시뮬레이션 시설의 짝을 확인하는 화면이 쓴다.
 * 고칠 수 있는 값은 시뮬레이션시설명 하나뿐이라 저장도 그 한 열만 건드린다.
 */
public interface CastFcltService {
	/** 터미널 1개분 매핑 전량 + 도면 마커 */
	FcltMapListDto retrieveFcltMapList(FcltMapSearchDto searchDto);

	/** 바뀐 매핑만 모아 저장 */
	JsonResponse saveFcltMapList(FcltMapSaveDto saveDto);
}
