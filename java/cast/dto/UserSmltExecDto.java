package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SmltExecStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltExecDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private int execSn; // 수행 일련번호
	private SmltExecStatus execStatus; // 수행 상태
	private String bgnDt; // 수행 시작일시 yyyyMMddHHmmss
}
