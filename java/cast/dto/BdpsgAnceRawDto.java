package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BdpsgAnceRawDto {
	private String hour; // 탑승객예고시 HH
	private int estBrdgTnope; // 예상탑승총인원수
}
