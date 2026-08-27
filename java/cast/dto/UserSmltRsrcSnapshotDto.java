package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserSmltRsrcSnapshotDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	// FS · CA · SBD · 시설운영이 공유하는 리소스 번호 (002~999)
	private String rsrcNo;

	private String smltId;
	private String tmnlId; // 시설 터미널 코드 (P01/P03)
	private List<String> fltTmnlIdList; // 조정률을 걸 운항 터미널. T1 은 P01 + P02
	private String excnYmd;

	// 사용자 조건으로 새로 발행한 리소스
	private String fltSchdlRsrcId; // FS002
	private String cknctAlctnRsrcId; // CA002
	private String sbdCntrlAlctnId; // SBD002
	private String fcltyOpngDptcnySrngRsrcId; // FacilityOpeningTable_DepartureGate002
	private String fcltyOpngScrtyCntrlRsrcId; // FacilityOpeningTable_SecurityControl002

	// 사용자가 편집하지 않아 일일 설정에서 그대로 승계한 리소스
	private String mdlRsrcId;
	private String prptStngRsrcId;
	private String cknctSrvcHrRsrcId;
	private String chknTypeRsrcId;
	private String rptStngAtrbId;
	private String fcltyOpngDptcnyRsrcId;
	private String fcltyOpngEntcnyRsrcId;
	private String fcltyOpngTrScrtyCntrlRsrcId;

	// 조정률 적용 대상 원천. FS001 이면 운영계에서, 아니면 기존 스케줄 리소스에서 복사한다
	private String srcFltSchdlRsrcId;

	private String ajmtTypeCd; // RATIO / HOURLY
	private int ajmtRt; // -100 ~ 100 증감률. 0 이면 원본 그대로
}
