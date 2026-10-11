package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltDepSaveDto extends UserSmltCurrentDto {
    private static final long serialVersionUID = 1L;
    private List<DepGateDto> dptgtList;
}
