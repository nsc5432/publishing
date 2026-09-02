package aoms.pm.cast.dto;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigAplyHstryDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private long aplySn;
	private String srcFixAtrbGroupId;
	private String tgtFixAtrbGroupId;
	private String tmnlId;
	private String tblNm;
	private String sheetNm;
	private int aplyRowCnt;
	private String cnclYn;
	private String revertableYn;
	private String frstRegDt;
	private String frstRgtrId;
}
