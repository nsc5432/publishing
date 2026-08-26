package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigColumnDto {
	private String column;
	private String label;
	private String type;
	private List<CastConfigOptionDto> optionList = new ArrayList<>();
	private String mergeYn;
}
