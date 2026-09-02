package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FltSmryRawDto {
	private int depFltCnt;
	private int arrFltCnt;
	private int depPsgCnt;
	private int arrPsgCnt;
	private int actlBrdgPsgCnt;
	private int rsvtBrdgPsgCnt;
}
