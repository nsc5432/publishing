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
			"FIX_ATRB_GROUP_ID",
			"PSG_ATRB_CD",
			"PSG_DTL_SE_CD",
			psgColumns(),
			"",
			validation("SUM", "입력값", "제출속성코드", 100),
			CastConfigCatalogKind.PSG_FIX,
			CastConfigTerminalRule.PSG_PARENT,
			List.of("INPT_VL")
	),
	SHOW_UP_ATRB(
			"출현속성",
			"TN_PM_SMLT_SHOW_UP_ATRB",
			"FIX_ATRB_GROUP_ID",
			"PSG_ATRB_CD",
			"PSG_DTL_SE_CD",
			psgColumns(),
			"",
			null,
			CastConfigCatalogKind.PSG_FIX,
			CastConfigTerminalRule.PSG_PARENT,
			List.of("INPT_VL")
	),
	SRVC_ATRB(
			"서비스속성",
			"TN_PM_SMLT_SRVC_ATRB",
			"FIX_ATRB_GROUP_ID",
			"FCLTY_SE_CD",
			"FCLTY_DTL_CD",
			srvcColumns(),
			"전환함수아이디",
			null,
			CastConfigCatalogKind.PSG_SRVC,
			CastConfigTerminalRule.SRVC,
			List.of()
	),
	CKNCT_TYPE_ATRB(
			"체크인유형",
			"TN_PM_SMLT_CKNCT_TYPE_ATRB_PRC",
			"CKNCT_TYPE_ATRB_ID",
			"ALN_CD",
			"",
			cknctTypeColumns(),
			"",
			null,
			CastConfigCatalogKind.CKNCT_TYPE,
			CastConfigTerminalRule.NONE,
			List.of("CKNCT_RT", "KOS_RT", "MOB_RT")
	);

	private final String sheetNm;
	private final String tableNm;
	private final String groupColumnNm;
	private final String keyColumnNm;
	private final String dtlColumnNm;
	private final List<CastConfigColumnDef> columnList;
	private final String shapeColumn;
	private final CastConfigValidationDto validation;
	private final CastConfigCatalogKind catalogKind;
	private final CastConfigTerminalRule terminalRule;
	/** 999→001 반영이 다루는 값 컬럼. 파이프라인이 채우지 않는 열을 넣으면 999 의 NULL 이 기준정보를 비운다 */
	private final List<String> prePrcsValueColumnList;

	CastConfigSheet(
			String sheetNm,
			String tableNm,
			String groupColumnNm,
			String keyColumnNm,
			String dtlColumnNm,
			List<CastConfigColumnDef> columnList,
			String shapeColumn,
			CastConfigValidationDto validation,
			CastConfigCatalogKind catalogKind,
			CastConfigTerminalRule terminalRule,
			List<String> prePrcsValueColumnList
	) {
		this.sheetNm = sheetNm;
		this.tableNm = tableNm;
		this.groupColumnNm = groupColumnNm;
		this.keyColumnNm = keyColumnNm;
		this.dtlColumnNm = dtlColumnNm;
		this.columnList = Collections.unmodifiableList(columnList);
		this.shapeColumn = shapeColumn;
		this.validation = validation;
		this.catalogKind = catalogKind;
		this.terminalRule = terminalRule;
		this.prePrcsValueColumnList = Collections.unmodifiableList(prePrcsValueColumnList);
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

	private static List<CastConfigColumnDef> cknctTypeColumns() {
		// CKNCT_VL/KOS_VL/MOB_VL 은 Counter/Kiosk/Mobile 고정 라벨이라 화면에 내지 않는다
		return List.of(
				column("항공사코드", CastConfigColumnType.READONLY, "ALN_CD", false, true),
				column("카운터비율", CastConfigColumnType.NUMBER, "CKNCT_RT", true, false),
				column("키오스크비율", CastConfigColumnType.NUMBER, "KOS_RT", true, false),
				column("모바일비율", CastConfigColumnType.NUMBER, "MOB_RT", true, false),
				column("서비스시간", CastConfigColumnType.NUMBER, "SRVC_HR", true, false)
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
