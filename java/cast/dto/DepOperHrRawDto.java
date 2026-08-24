package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DepOperHrRawDto {
	private String dptgtNo; // 출국장 번호 — OPER_HR_MNG.FCLTY_TYPE_ID
	private String bgnHm; // 운영 시작 HHmm
	private String endHm; // 운영 종료 HHmm
}
