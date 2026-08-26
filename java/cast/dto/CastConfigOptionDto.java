package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigOptionDto {
	private String code;
	private String label;
	private List<String> shapeColumnList = new ArrayList<>();
}
