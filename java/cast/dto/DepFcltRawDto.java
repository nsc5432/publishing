package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepFcltRawDto {
	private String depNum; // 출국장 번호 — PSG_FCLT_CD 4번째 자리
	private String depNm; // 여객시설명
	private String useYn; // 시설 사용여부 (마스터 기준)
}
