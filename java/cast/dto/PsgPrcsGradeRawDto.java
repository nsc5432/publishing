package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PsgPrcsGradeRawDto {
	private String fcltGroupCd;
	private String psgPrcsGrdCd;
	private int minVl; // 대기시간 하한 (분, 포함)
	private int maxVl; // 대기시간 상한 (분). 그 분 59초까지 포함한다
}
