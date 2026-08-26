package aoms.pm.cast.enums;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import aoms.pm.cast.dto.CastConfigOptionDto;
import aoms.pm.cast.dto.CastConfigValidationDto;

import lombok.Getter;

@Getter
public enum CastConfigSheet {
	PSG_ATRB(
			"여객유형속성",
			"TN_PM_SMLT_PSG_ATRB",
			"PSG_ATRB_CD",
			"PSG_DTL_SE_CD",
			psgColumns(),
			"",
			validation("SUM", "입력값", "제출속성코드", 100),
			CastConfigCatalogKind.PSG_FIX,
			CastConfigTerminalRule.PSG_PARENT
	),
	SHOW_UP_ATRB(
			"출현속성",
			"TN_PM_SMLT_SHOW_UP_ATRB",
			"PSG_ATRB_CD",
			"PSG_DTL_SE_CD",
			psgColumns(),
			"",
			null,
			CastConfigCatalogKind.PSG_FIX,
			CastConfigTerminalRule.PSG_PARENT
	),
	SRVC_ATRB(
			"서비스속성",
			"TN_PM_SMLT_SRVC_ATRB",
			"FCLTY_SE_CD",
			"FCLTY_DTL_CD",
			srvcColumns(),
			"전환함수아이디",
			null,
			CastConfigCatalogKind.PSG_SRVC,
			CastConfigTerminalRule.SRVC
	);

	private final String sheetNm;
	private final String tableNm;
	private final String keyColumnNm;
	private final String dtlColumnNm;
	private final List<CastConfigColumnDef> columnList;
	private final String shapeColumn;
	private final CastConfigValidationDto validation;
	private final CastConfigCatalogKind catalogKind;
	private final CastConfigTerminalRule terminalRule;

	CastConfigSheet(
			String sheetNm,
			String tableNm,
			String keyColumnNm,
			String dtlColumnNm,
			List<CastConfigColumnDef> columnList,
			String shapeColumn,
			CastConfigValidationDto validation,
			CastConfigCatalogKind catalogKind,
			CastConfigTerminalRule terminalRule
	) {
		this.sheetNm = sheetNm;
		this.tableNm = tableNm;
		this.keyColumnNm = keyColumnNm;
		this.dtlColumnNm = dtlColumnNm;
		this.columnList = Collections.unmodifiableList(columnList);
		this.shapeColumn = shapeColumn;
		this.validation = validation;
		this.catalogKind = catalogKind;
		this.terminalRule = terminalRule;
	}

	public CastConfigColumnDef getColumn(String column) {
		return columnList.stream()
				.filter(item -> item.getColumn().equals(column))
				.findFirst()
				.orElse(null);
	}

	public static CastConfigSheet fromSheetNm(String sheetNm) {
		return Arrays.stream(values())
				.filter(sheet -> sheet.sheetNm.equals(sheetNm))
				.findFirst()
				.orElse(null);
	}

	private static List<CastConfigColumnDef> psgColumns() {
		return List.of(
				column("제출속성코드", CastConfigColumnType.READONLY, "PSG_ATRB_CD", false, true),
				column("제출상세구분코드", CastConfigColumnType.READONLY, "PSG_DTL_SE_CD", false, false),
				column("입력값", CastConfigColumnType.NUMBER, "INPT_VL", true, false),
				column("사용자정의값1", CastConfigColumnType.TEXT, "USER_DEF_1_VL", true, false),
				column("사용자정의값2", CastConfigColumnType.TEXT, "USER_DEF_2_VL", true, false)
		);
	}

	private static List<CastConfigColumnDef> srvcColumns() {
		List<CastConfigOptionDto> distributionOptions = List.of(
				option("TIDConstant", "입력값"),
				option("TIDRandomized", "최소값", "최대값"),
				option("TIDTriangle", "최소값", "최대값", "분포최대값"),
				option("TIDNegExp", "입력값"),
				option("TIDNormal", "최소값", "최대값"),
				option("TIDErlang", "최소값", "최대값")
		);

		return List.of(
				column("시설구분코드", CastConfigColumnType.READONLY, "FCLTY_SE_CD", false, true),
				column("시설상세코드", CastConfigColumnType.READONLY, "FCLTY_DTL_CD", false, false),
				column("전환함수아이디", CastConfigColumnType.SELECT, "SWTC_FNC_ID", true, false, distributionOptions),
				column("입력값", CastConfigColumnType.NUMBER, "INPT_VL", true, false),
				column("최소값", CastConfigColumnType.NUMBER, "MIN_VL", true, false),
				column("최대값", CastConfigColumnType.NUMBER, "MAX_VL", true, false),
				column("분포최대값", CastConfigColumnType.NUMBER, "DSTB_MAX_VL", true, false),
				column("값유형", CastConfigColumnType.SELECT, "VL_TYPE", true, false),
				column("검증함수아이디", CastConfigColumnType.SELECT, "VRFC_FNC_ID", true, false)
		);
	}

	private static CastConfigColumnDef column(
			String column,
			CastConfigColumnType type,
			String physicalColumn,
			boolean editable,
			boolean merge
	) {
		return column(column, type, physicalColumn, editable, merge, List.of());
	}

	private static CastConfigColumnDef column(
			String column,
			CastConfigColumnType type,
			String physicalColumn,
			boolean editable,
			boolean merge,
			List<CastConfigOptionDto> optionList
	) {
		return new CastConfigColumnDef(column, column, type, physicalColumn, editable, merge, optionList);
	}

	private static CastConfigOptionDto option(String code, String... shapeColumns) {
		CastConfigOptionDto result = new CastConfigOptionDto();
		result.setCode(code);
		result.setLabel(code);
		result.setShapeColumnList(List.of(shapeColumns));
		return result;
	}

	private static CastConfigValidationDto validation(
			String kind,
			String column,
			String groupColumn,
			double target
	) {
		CastConfigValidationDto result = new CastConfigValidationDto();
		result.setKind(kind);
		result.setColumn(column);
		result.setGroupColumn(groupColumn);
		result.setTarget(target);
		return result;
	}
}
