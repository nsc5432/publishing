package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltChknSaveDto extends UserSmltCurrentDto {
    private static final long serialVersionUID = 1L;
    private List<ChknIslandDto> islandList;
}
