package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigAplySetHstryListDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private int totalCnt;
	private List<CastConfigAplySetHstryDto> hstryList = new ArrayList<>();
}
