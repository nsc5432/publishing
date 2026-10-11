package aoms.pm.cast.dto;

import aoms.pm.cast.enums.SmltExecStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltExecDto extends JsonResponse {
    private static final long serialVersionUID = 1L;

    private String smltId;
    private String smltReqId;
    private SmltExecStatus smltFlfmtSttsCd;
    private String smltFlfmtBgngDt;
}
