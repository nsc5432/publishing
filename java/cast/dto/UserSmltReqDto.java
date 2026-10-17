package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltReqDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

    private String smltReqId;
    private String smltId;
    private String excnYmd;
    private String rsltSmltId;

    private String mdlRsrcId;
    private String fltSchdlRsrcId;
    private String cknctAlctnRsrcId;
    private String sbdCntrlAlctnId;
    private String prptStngRsrcId;
    private String fcltyOpngDptcnySrngRsrcId;
    private String fcltyOpngDptcnyRsrcId;
    private String fcltyOpngEntcnyRsrcId;
    private String fcltyOpngScrtyCntrlRsrcId;
    private String fcltyOpngTrScrtyCntrlRsrcId;
    private String cknctSrvcHrRsrcId;
    private String chknTypeRsrcId;
    private String rptStngAtrbId;
    private String smltRsltSfx;

    private String smltStts;
    private String fromStts;
    private String errMsg;
}
