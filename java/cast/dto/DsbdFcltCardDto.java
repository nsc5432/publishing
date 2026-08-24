package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.CongestionStatus;
import aoms.pm.cast.enums.FcltType;

import lombok.Getter;
import lombok.Setter;

/** 게이트 카드 1장 = 캐러셀 1페이지 */
@Getter
@Setter
public class DsbdFcltCardDto {
	private String cardId; // 카드 식별자
	private FcltType fcltType; // CHKN / DEP
	private String island; // 체크인카운터 아일랜드 (출국장이면 '')
	private String dptgtNo; // 출국장 번호 (체크인카운터면 '')
	private String fcltNm; // 표시명 (예: B / 3번)
	private String fcltDesc; // 부가 표기 (예: 좌측 B4~B8)
	private int totCnt; // 전체 (개)
	private int oprCnt; // 운영 (개)
	private int wtngPsgCnt; // 대기열(체크인) · 예상인원(출국장) (명)
	private int hrlyPrcsPsgCnt; // 시간당 처리인원 (Pax/Min)
	private int hrlyPrcsRate; // 시간당 처리율 게이지 0~100
	private String cgnClearTime; // 혼잡해소 예상 시각 HHmm
	private int cgnClearRate; // 혼잡해소 게이지 0~100
	private CongestionStatus cgnStatus; // 카드 혼잡도
	private FcltRecommendDto recommend; // 추천 조치
	private List<FcltUnitDto> unitList; // 하단 칩
}
