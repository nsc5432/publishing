package aoms.pm.cmmn.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrtrCdDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;
	
	private String crtrCd;
	private String crtrAplcnBgngYmd;
	private String crtrCdNm;
	private String crtrCd1Vl;
	private String crtrCd2Vl;
	private String crtrCd3Vl;
	private String crtrCd4Vl;
}
