package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigAplySetHstryDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private long aplySetSn;
	private String srcFixAtrbGroupId;
	private String tgtFixAtrbGroupId;
	private int aplyRowCnt;
	private String cnclYn;
	private String revertableYn;
	private String frstRegDt;
	private String frstRgtrId;
	private List<CastConfigAplyHstryDto> detailList = new ArrayList<>();
}
