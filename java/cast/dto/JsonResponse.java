package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JsonResponse extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	
	private boolean isError;
	private String errorMessage;
	
	public JsonResponse error(String errorMessage) {
		this.isError = true;
		this.errorMessage = errorMessage;
		return this;
	}
}
