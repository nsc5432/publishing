package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 사용자 시뮬레이션 조건 설정 진입 정보
 */
@Getter
@Setter
public class UserSmltInfoDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId; // 시뮬레이션 ID
	private String ymd; // 기준일자 yyyyMMdd
	private String saveDt; // 마지막 저장 시각 yyyyMMddHHmmss
	private String smltFlfmtSttsCd; // 직전 수행 상태 (RUNNING / DONE)
}
