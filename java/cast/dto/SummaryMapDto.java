package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SummaryMapDto {
	private List<SmryScDto> scList;
	private List<SmryDepDto> depList;
	private List<SmryChknDto> chknList;
}
