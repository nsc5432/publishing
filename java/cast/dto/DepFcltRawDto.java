package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepFcltRawDto {
	private String dptgtNo; // 출국장 번호
	private String dptgtNm; // 여객시설명
	private String useYn; // 시설 사용여부 (마스터 기준)
}
