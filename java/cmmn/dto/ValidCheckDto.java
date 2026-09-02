package aoms.pm.cmmn.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ValidCheckDto {
	private boolean isValid;
	private String message;
	private int operHrSn;
	private int strgSn;
	private int newOperHrSn;
}
