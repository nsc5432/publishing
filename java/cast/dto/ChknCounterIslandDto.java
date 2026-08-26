package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

/**
 * 아일랜드 1곳
 */
@Getter
@Setter
public class ChknCounterIslandDto {
	private String island; // 아일랜드 문자
	private String fcltNm; // 표시명
	private int totCnt; // 보유 카운터 수 (개)
	private int counterCnt; // 유인 카운터 (개)
	private int kioskCnt; // 키오스크 (대)
	private int bagDropCnt; // 셀프백드롭 (대)
	private List<String> alnCdList; // 배정 항공사 코드
	private List<OprTimeDto> oprTimeList; // 운영 시간 구간
	private String useYn; // 사용여부
}
