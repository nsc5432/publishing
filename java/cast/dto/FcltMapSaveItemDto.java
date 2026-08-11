package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

/** 시설물 매핑 저장 항목 — 바뀐 시설만 온다 */
@Getter
@Setter
public class FcltMapSaveItemDto {
	private String psgFcltCd; // 여객시설코드 (PK)
	private String smltFcltNm; // 새 시뮬레이션시설명. 빈 값이면 매핑 해제
}
