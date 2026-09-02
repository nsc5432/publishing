package aoms.pm.cast.dto;

import java.math.BigDecimal;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigAtrbRawDto {
	private String atrbCd;
	private String dtlSeCd;
	private String inptVl;
	private String userDef1Vl;
	private String userDef2Vl;
	private BigDecimal minVl;
	private BigDecimal maxVl;
	private BigDecimal dstbMaxVl;
	private String vlType;
	private String swtcFncId;
	private String vrfcFncId;
	private String atrbCdNm;
	private String dtlSeCdNm;
	private String catalogVlType;
	private String cknctRt;
	private String kosRt;
	private String mobRt;
	private String srvcHr;
	private String cndTypeCd;
	private String cndVl;
	private String prePrcsYn;
}
