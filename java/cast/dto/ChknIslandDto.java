package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknIslandDto {
	private String island; // 아일랜드 문자
	private int boothCnt; // 운영 부스 수 — 블럭 수의 근거
	private int kioskCnt; // 셀프체크인 키오스크 대수
	private int bagDropCnt; // 셀프백드랍 대수
	private List<OprTimeDto> oprTimeList; // 아일랜드 운영시간 구간
	private List<ChknBoothDto> boothList; // 부스별 항공사 배정
}
