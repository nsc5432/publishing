package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigSetDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private String fixAtrbGroupId;
	private List<CastConfigSetDatasetDto> datasetList = new ArrayList<>();
}
