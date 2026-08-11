package aoms.pm.cast.dto;

import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 시설물 매핑 1건 — TN_PM_SMLT_PSG_FCLT 한 행.
 *
 * 공항 여객시설({@code psgFcltCd} · {@code psgFcltNm})과 CAST 시뮬레이션 시설
 * ({@code smltFcltNm})의 짝이 화면이 확인하려는 대상이다.
 * <b>{@code smltFcltNm} 만 사용자가 고칠 수 있고</b> 나머지는 조회 전용이다.
 */
@Getter
@Setter
public class FcltMapItemDto {
	private String psgFcltCd; // 여객시설코드 (PK)
	private String upPsgFcltCd; // 상위여객시설코드 (CC/CK/SBD/LGT/SC/SR …) — 화면의 시설그룹
	private String upPsgFcltNm; // 상위여객시설명. 상위 행이 없으면 시설구분 이름으로 채운다
	private String psgFcltNm; // 여객시설명
	private String psgFcltExpln; // 여객시설설명
	private String smltFcltNm; // 시뮬레이션시설명 (CAST) — 빈 문자열이면 미매핑
	private TerminalKind tmnlId; // T1 / T2 (DB 의 P01/P03 을 되돌린 값)
	private FcltType fcltType; // 도면 마커 색 · 범례 구분
	private String island; // 아일랜드(A~N) · 출국장 마커 id — 도면과 이어 주는 키. 없으면 ''
	private int sortSeq; // 정렬순서
	private String useYn; // 사용여부
	private String lastMdfrId; // 최종수정자
	private String lastMdfcnDt; // 최종수정일시 (yyyyMMddHHmmss)
}
