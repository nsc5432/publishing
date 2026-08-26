package aoms.pm.cast.enums;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import aoms.pm.cast.dto.CastConfigOptionDto;

import lombok.Getter;

@Getter
public class CastConfigColumnDef {
	private final String column;
	private final String label;
	private final CastConfigColumnType type;
	private final String physicalColumn;
	private final boolean editable;
	private final boolean merge;
	private final List<CastConfigOptionDto> optionList;

	public CastConfigColumnDef(
			String column,
			String label,
			CastConfigColumnType type,
			String physicalColumn,
			boolean editable,
			boolean merge,
			List<CastConfigOptionDto> optionList
	) {
		this.column = column;
		this.label = label;
		this.type = type;
		this.physicalColumn = physicalColumn;
		this.editable = editable;
		this.merge = merge;
		this.optionList = Collections.unmodifiableList(new ArrayList<>(optionList));
	}
}
