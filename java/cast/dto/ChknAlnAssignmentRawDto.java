package aoms.pm.cast.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChknAlnAssignmentRawDto {
	private String unitCd;
	private String alnCd;
	private String alnNm;
	private int assignedCnt;
	private int openCnt;
}
