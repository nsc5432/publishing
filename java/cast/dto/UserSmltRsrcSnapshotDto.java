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
	private String fcltyOpngScrtyCntrlRsrcId; // FacilityOpeningTable_SecurityControl002, 001과 같으면 001
	private String fcltyOpngEntcnyRsrcId; // FacilityOpeningTable_Immigration001
	private String fcltyOpngTrScrtyCntrlRsrcId; // FacilityOpeningTable_TransferSecurityControl001
	private String prptStngRsrcId; // PS500

	private String mdlRsrcId;
	private String cknctSrvcHrRsrcId;
	private String chknTypeRsrcId;
	private String rptStngAtrbId;
	private String fcltyOpngDptcnyRsrcId;
	private String srcFltSchdlRsrcId;

	private List<FltAjmtRow> fltAjmtList = new ArrayList<>();
	private List<ChknIslRow> chknIslList = new ArrayList<>();
	private List<ChknBoothAltmntRow> chknBoothAltmntList = new ArrayList<>();
	private List<DptgtRow> dptgtList = new ArrayList<>();
	private List<OperHrRow> dptgtOperHrList = new ArrayList<>();

	@Getter
	@AllArgsConstructor
	public static class FltAjmtRow {
		private String tmnlId;
		private String hour; // HH
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
	public static class ChknBoothAltmntRow {
		private String tmnlId;
		private String chknIslCd;
		private int boothNo;
		private int altmntSn;
		private String alnCd;
		private int operBgngHour;
		private int operEndHour;
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
