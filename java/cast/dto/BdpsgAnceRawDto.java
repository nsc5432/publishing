package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BdpsgAnceRawDto {
	private String hour; // 탑승객예고시(BDPSG_ANCE_HOUR) HH
	private int estBrdgTnope; // 예상탑승총인원수(EST_BRDG_TNOPE) 합계
}
