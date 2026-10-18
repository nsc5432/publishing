package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltExcnDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

    private String smltId;
    private String tmnlId;
    private String smltType;
    private String smltStts;
    private String smltFlfmtBgngDt;
    private String smltFlfmtEndDt;
    private String excnYmd;
    private int rowNum;
    private String rgtrId;
    private String deptNm;
    private String userNm;
    private int execMin;
}
