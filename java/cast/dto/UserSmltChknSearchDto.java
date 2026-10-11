package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltChknSearchDto extends UserSmltCurrentDto {
    private String smltId;
    private String island;
}
