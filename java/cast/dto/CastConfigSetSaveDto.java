package aoms.pm.cast.dto;

import java.util.ArrayList;
import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigSetSaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private String fixAtrbGroupId;
	private List<CastConfigSetSaveItemDto> itemList = new ArrayList<>();
}
