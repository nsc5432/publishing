package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 1곳 — 하루 내내 그대로인 부분(자원 구성 · 운영시간).
 *
 * 셀프체크인/백드롭을 따로 내려주지 않는다. 서로 다른 시설이 아니라 같은 아일랜드가 가진
 * 자원의 종류일 뿐이라 유인 카운터와 같은 자리에 담는다 (화면도 한 메뉴로 합쳐져 있다).
 * 혼잡도 · 지표는 시각마다 달라지므로 슬롯({@link ChknCounterSlotDto})이 갖는다.
 */
@Getter
@Setter
public class ChknCounterIslandDto {
	private String island; // 아일랜드 문자 (A~N, I 제외)
	private String fcltNm; // 표시명 (예: 아일랜드 A)
	private int totCnt; // 보유 카운터 수 (개)
	private int counterCnt; // 유인 체크인카운터 운영 대수 (개)
	private int kioskCnt; // 셀프체크인 키오스크 대수 (대)
	private int bagDropCnt; // 셀프백드롭 대수 (대)
	private List<String> alnCdList; // 배정 항공사 코드
	private List<OprTimeDto> oprTimeList; // 운영 시간 구간
	private String useYn; // N 이면 미운영 (그날 배정이 없다)
}
