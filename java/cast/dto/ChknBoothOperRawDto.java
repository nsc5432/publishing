package aoms.pm.cast.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

/**
 * @Classname : ChknBoothOperRawDto.java
 * @Description : 실행 CA 리소스 기준 체크인카운터 운영 구간 1행
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
public class ChknBoothOperRawDto {
	private String island;
	private String cknctId;
	private LocalDateTime bgnDt; // 운영 시작 (포함)
	private LocalDateTime endDt; // 운영 종료 (미포함)
}
