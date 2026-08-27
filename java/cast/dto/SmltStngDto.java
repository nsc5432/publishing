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
	// 컬럼명과 어긋나면 mapUnderscoreToCamelCase 가 못 채워 조용히 null 이 된다
	private String fcltyOpngDptcnySrngRsrcId;
	private String fcltyOpngEmiRsrcId;
	private String fcltyOpngImmiRsrcId;
	private String fcltyOpngScrtyCntrlRsrcId;
	private String fcltyOpngTrScrtyCntrlRsrcId;
	private String sbdCntrlAlctnId;
	private LocalDateTime planBgngDt;
	private LocalDateTime planEndDt;
	private LocalDateTime smltBgngDt;
	private LocalDateTime smltEndDt;
	private String bdpsgAnceYn;
}
