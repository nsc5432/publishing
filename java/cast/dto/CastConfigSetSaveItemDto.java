package aoms.pm.cast.dto;

import java.io.Serializable;

import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CastConfigSetSaveItemDto implements Serializable {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId;
	private String groupId;
	private String sheetNm;
	private int rowNo;
	private String column;
	private String value;
}
