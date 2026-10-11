package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltDepSearchDto extends UserSmltCurrentDto {
    private String smltId;
    private String dptgtNo;
}
