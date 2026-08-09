package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 운영시간 도넛 카드 — 출국장 1곳당 1장 */
@Getter
@Setter
public class MapOperCardDto {
	private String depNum; // 출국장 번호
	private int oprRate; // 도넛 게이지 0~100
	private String oprBgnTime; // 운영 시작 HHmm
	private String oprEndTime; // 운영 종료 HHmm
	private int oprHr; // 하루 운영 시간
	private String useYn; // N 이면 미운영(흐림)
}
