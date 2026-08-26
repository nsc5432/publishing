package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigGroupDto {
	private String groupId;
	private String groupNm;
	private String groupNmEn;
	private String groupDesc;
	private List<CastConfigDatasetSummaryDto> datasetList = new ArrayList<>();
}
