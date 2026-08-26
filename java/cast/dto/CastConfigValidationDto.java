package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigValidationDto {
	private String kind;
	private String column;
	private String groupColumn;
	private double target;
}
