package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltExecSearchDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;

    private String ymd;
    private List<UserSmltFltPsgSaveDto> fltPsgList;
    private List<UserSmltChknSaveDto> chknList;
    private List<UserSmltDepSaveDto> depList;
}
