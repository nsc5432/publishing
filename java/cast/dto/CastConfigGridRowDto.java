package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigGridRowDto {
	private int rowNo;
	private List<CastConfigGridCellDto> cellList = new ArrayList<>();
}
