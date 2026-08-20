package aoms.pm.cast.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltStngDto {
	private String smltId;
	private int smltMdlSn;
	private String smltNm;
	private String smltType;
	private LocalDateTime crtrDt;
	private String excnYmd;
	private String tmnlId;
	private String slfId;
	private String prntId;
	private String fltSchdlRsrcId;
	private String bagAlctnRsrcId;
	private String cknctAlctnRsrcId;
	private String prptSetRsrcId;
	private String mdlRsrcId;
	private String excnId;
	private String cknctSrvcHrRsrcId;
	private String chknTypeRsrcId;
	private String fcltyOpngTblEmiRsrcId;
	private String fcltyOpngTblImmiRsrcId;
	private String fcltyOpngTblScrtyCntrlRsrcId;
	private String fcltyOpngTblTrScrtyCntrlRsrcId;
	private String sbdCntrlAlctnId;
	private LocalDateTime planBgngDt;
	private LocalDateTime planEndDt;
	private LocalDateTime smltBgngDt;
	private LocalDateTime smltEndDt;
	private String bdpsgAnceYn;
}
