package aoms.pm.cast.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PsgPrcsGradeRawDto {
	private String fcltGroupCd;
	private String psgPrcsGrdCd;
	private BigDecimal minVl;
	private BigDecimal maxVl;
}
