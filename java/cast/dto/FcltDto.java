package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FcltDto extends JsonResponse {
	private static final long serialVersionUID = 1L;
	
	private int fcltySn;
	private String fcltNm;
	private String fcltGroupCd;
	private String tmnlId;
	private String cdntLat;
	private String cdntLng;
}
