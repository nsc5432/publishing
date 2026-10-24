package aoms.pm.cast.dto;

import java.math.BigDecimal;

import aoms.pm.cast.enums.FcltQueueScenarioMode;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/** 요약보기 시설 카드 혼잡해소 시나리오 팝업 조회 조건 */
@Getter
@Setter
public class FcltQueueScenarioSearchDto {
	private String smltId;
	private String ymd; // 확정 조회일자 yyyyMMdd
	private String hhmm; // 확정 조회시각 HHmm = 평가시각 t (관측구간은 [t-30분, t))
	private TerminalKind tmnlId;
	private FcltType fcltType; // CHKN / DEP
	private String unitCd; // 아일랜드 문자 / 출국장 번호
	private FcltQueueScenarioMode mode;
	// Jackson 기본 설정은 2.5 를 2 로 잘라 받으므로 소수 입력을 거르기 위해 BigDecimal 로 받는다
	private BigDecimal oprFcltCnt; // COUNT: 조정 수량 (생략 시 현재 운영 수량)
	private BigDecimal targetMinutes; // TIME: 목표 해소시간 (분, 생략 시 기본값)
}
