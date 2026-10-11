package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltRsrcSnapshotDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String rsrcNo;
	private String smltId;
	private String excnYmd;

	private String fltSchdlRsrcId; // FS002
	private String cknctAlctnRsrcId; // CA002
	private String sbdCntrlAlctnId; // SBD002
	private String fcltyOpngDptcnySrngRsrcId; // FacilityOpeningTable_DepartureGate002
	private String fcltyOpngScrtyCntrlRsrcId; // FacilityOpeningTable_SecurityControl002

	private String mdlRsrcId;
	private String prptStngRsrcId;
	private String cknctSrvcHrRsrcId;
	private String chknTypeRsrcId;
	private String rptStngAtrbId;
	private String fcltyOpngDptcnyRsrcId;
	private String fcltyOpngEntcnyRsrcId;
	private String fcltyOpngTrScrtyCntrlRsrcId;
	private String srcFltSchdlRsrcId;
}
