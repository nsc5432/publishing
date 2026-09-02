package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigCategoryDto {
	private String fixAtrbGroupId;
	private String atrbGroupNm;
	private String baseYn;
	private String prePrcsYn;
	private String cfmtnYn;
	private String groupPrcsSttsCd;
	private String frstRegDt;
	private String lastMdfcnDt;
}
