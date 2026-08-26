package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigDatasetDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String sheetNm = "";
	private String dimension = "";
	private List<CastConfigColumnDto> columnList = new ArrayList<>();
	private List<CastConfigGridRowDto> rowList = new ArrayList<>();
	private String shapeColumn = "";
	private CastConfigValidationDto validation;
}
