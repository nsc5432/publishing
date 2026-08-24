package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SmltExecStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltExecDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String smltId;
	private int smltFlfmtSn; // 수행 일련번호
	private SmltExecStatus smltFlfmtSttsCd; // 수행 상태
	private String smltFlfmtBgngDt; // 수행 시작일시 yyyyMMddHHmmss
}
