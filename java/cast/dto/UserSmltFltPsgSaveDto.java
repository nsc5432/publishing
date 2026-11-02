package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltFltPsgSaveDto extends UserSmltCurrentDto {
    private static final long serialVersionUID = 1L;
    private int ajmtRt;
    private List<FltPsgHourDto> hourList;
}
