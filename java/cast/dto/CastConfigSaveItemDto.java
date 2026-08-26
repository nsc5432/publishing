package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigSaveItemDto {
	private String fixAtrbGroupId;
	private String sheetNm;
	private int rowNo;
	private String column;
	private String value;
}
