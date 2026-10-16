package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.AllArgsConstructor;
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
	private String fcltyOpngEntcnyRsrcId; // FacilityOpeningTable_Immigration002
	private String fcltyOpngTrScrtyCntrlRsrcId; // FacilityOpeningTable_TransferSecurityControl002
	private String prptStngRsrcId; // PS500

	private String srcPrptSetRsrcId;
	private String mdlRsrcId;
	private String cknctSrvcHrRsrcId;
	private String chknTypeRsrcId;
	private String rptStngAtrbId;
	private String fcltyOpngDptcnyRsrcId;
	private String srcFltSchdlRsrcId;
	private String srcFcltyOpngEntcnyRsrcId;
	private String srcFcltyOpngTrScrtyCntrlRsrcId;

	private List<FltAjmtRow> fltAjmtList = new ArrayList<>();
	private List<ChknIslRow> chknIslList = new ArrayList<>();
	private List<OperHrRow> chknOperHrList = new ArrayList<>();
	private List<ChknBoothRow> chknBoothList = new ArrayList<>();
	private List<DptgtRow> dptgtList = new ArrayList<>();
	private List<OperHrRow> dptgtOperHrList = new ArrayList<>();

	@Getter
	@AllArgsConstructor
	public static class FltAjmtRow {
		private String tmnlId;
		private int ajmtRt;
	}

	@Getter
	@AllArgsConstructor
	public static class ChknIslRow {
		private String tmnlId;
		private String chknIslCd;
		private int kosCnt;
		private int sbdCnt;
	}

	@Getter
	@AllArgsConstructor
	public static class ChknBoothRow {
		private String tmnlId;
		private String chknIslCd;
		private int boothNo;
		private String alnCd;
	}

	@Getter
	@AllArgsConstructor
	public static class DptgtRow {
		private String tmnlId;
		private String dptgtNo;
		private String oprYn;
		private int scshCntom;
		private int gnrlSrchCntom;
		private int smartPassSrchCntom;
	}

	@Getter
	@AllArgsConstructor
	public static class OperHrRow {
		private String tmnlId;
		private String fcltCd; // 체크인은 아일랜드 문자, 출국장은 출국장 번호
		private int operHrSn;
		private int operBgngHour;
		private int operEndHour;
	}
}
