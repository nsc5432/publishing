package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigAplyHstryListDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private int totalCnt;
	private List<CastConfigAplyHstryDto> hstryList = new ArrayList<>();
}
