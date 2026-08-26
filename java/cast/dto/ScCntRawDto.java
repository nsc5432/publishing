package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScCntRawDto {
	private String dptgtNo; // 출국장 번호
	private int scshCntom; // 검색대 대수 — FCLTY_CNT
}
