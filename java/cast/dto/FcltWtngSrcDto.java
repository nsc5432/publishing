package aoms.pm.cast.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : FcltWtngSrcDto.java
 * @Description : 시설 대기 결과 완전성 검사용 원천 범위 — 시설 단위별 첫 결과 시각
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Getter
@Setter
public class FcltWtngSrcDto {
	private String unitCd; // 시설 단위 (아일랜드 / 출국장). 비어 있으면 null
	private LocalDateTime minActlDt;
}
