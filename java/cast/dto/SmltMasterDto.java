package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltMasterDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;
    private String smltId;
    private String smltType;
    private String excnYmd;
    private String smltStts;
    private String smltBgngDt;
    private String smltEndDt;
    private String sourceKey;
}
