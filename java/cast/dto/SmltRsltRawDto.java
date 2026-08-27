package aoms.pm.cast.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltRsltRawDto {
	private String time; // 결과 시각 HHmm
	private LocalDateTime smltActlDt;
	private String upPsgFcltCd; // 상위시설코드
	private String psgFcltCd; // 여객시설코드
	private String psgFcltNm; // 여객시설명
	private String unitCd; // 화면 묶음 단위
	private int wtngPsgCnt; // 대기여객수 (명)
	private int trnstPsgCnt; // 통과여객수 (명)
	private int wtngHr; // 평균대기시간 (초)
	private int prcsHr; // 평균처리시간 (초)
}
