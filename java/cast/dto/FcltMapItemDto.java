package aoms.pm.cast.dto;

import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 시설물 매핑 1건
 */
@Getter
@Setter
public class FcltMapItemDto {
	private String psgFcltCd; // 여객시설코드
	private String upPsgFcltCd; // 상위여객시설코드
	private String upPsgFcltNm; // 상위여객시설명
	private String psgFcltNm; // 여객시설명
	private String psgFcltExpln; // 여객시설설명
	private String smltFcltNm; // 시뮬레이션시설명
	private TerminalKind tmnlId; // T1 / T2
	private FcltType fcltType; // 시설 구분
	private String island; // 아일랜드 · 출국장 마커 id
	private int sortSeq; // 정렬순서
	private String useYn; // 사용여부
	private String lastMdfrId; // 최종수정자
	private String lastMdfcnDt; // 최종수정일시 yyyyMMddHHmmss
}
