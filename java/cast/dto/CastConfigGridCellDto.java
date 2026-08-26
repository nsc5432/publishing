package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigGridCellDto {
	private String column;
	private String value;
	private String formula = "";
	private String editableYn;
}
