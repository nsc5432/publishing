package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltCurrentDto extends AomsDefaultDto {
    private static final long serialVersionUID = 1L;
    private String ymd;
    private TerminalKind tmnlId;
    @JsonIgnore private String fcltTmnlId;
}
