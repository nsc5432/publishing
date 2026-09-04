package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigSetDatasetDto {
	private String tmnlId;
	private String groupId;
	private String groupNm;
	private CastConfigDatasetDto dataset;
}
