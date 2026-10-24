package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.FcltType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DsbdFcltCardDto {
	private String cardId; // 카드 식별자
	private FcltType fcltType; // CHKN / DEP
	private String island; // 체크인카운터 아일랜드
	private String dptgtNo; // 출국장 번호 (체크인카운터면 '')
	private String fcltNm; // 표시명 (예: B / 3번)
	private int totCnt; // 전체 (개)
	private int oprCnt; // 운영 (개)
	private int wtngPsgCnt; // 평가시각(hhmm) 대기인원 (명). 출국장은 SC+SR
	private int hrlyPrcsPsgCnt; // 직전 30분 처리인원의 시간당 환산 (Pax/Hour)
	private int hrlyPrcsRate; // 부하율 rho × 100. 100 을 넘을 수 있다. 산정 불가면 0
	private String cgnClearTime; // 추천 수량 적용 시 혼잡해소 예상 시각 HHmm. 산정 불가면 ''
	private int cgnClearRate; // 혼잡해소 게이지 max(30 - 해소분, 0) / 30 × 100
	private Double cgnWtngSec; // 혼잡 판정값 — 직전 30분 처리 여객 평균 대기시간 (초, 소수 원값). 산정 불가면 null
	private CongestionStatus cgnStatus; // 카드 혼잡도. 산정 불가면 null
	private FcltRecommendDto recommend; // 추천 조치
	private List<FcltUnitDto> unitList; // 하단 칩
}
