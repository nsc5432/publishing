package aoms.pm.cast.service.impl;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.multipart.MultipartFile;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.CastConfigAtrbRawDto;
import aoms.pm.cast.dto.CastConfigCategoryDto;
import aoms.pm.cast.dto.CastConfigCategoryListDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;
import aoms.pm.cast.dto.CastConfigColumnDto;
import aoms.pm.cast.dto.CastConfigDatasetDto;
import aoms.pm.cast.dto.CastConfigDatasetSummaryDto;
import aoms.pm.cast.dto.CastConfigDefaultApplyDto;
import aoms.pm.cast.dto.CastConfigGridCellDto;
import aoms.pm.cast.dto.CastConfigGridRowDto;
import aoms.pm.cast.dto.CastConfigGroupDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigSaveDto;
import aoms.pm.cast.dto.CastConfigSaveItemDto;
import aoms.pm.cast.dto.CastConfigSearchDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.enums.CastConfigCatalogKind;
import aoms.pm.cast.enums.CastConfigColumnDef;
import aoms.pm.cast.enums.CastConfigColumnType;
import aoms.pm.cast.enums.CastConfigGroup;
import aoms.pm.cast.enums.CastConfigSheet;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastConfigMapper;
import aoms.pm.cast.service.CastConfigService;
import aoms.pm.utils.SessionUtils;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastConfigServiceImpl implements CastConfigService {
	private static final String BASE_FIX_ATRB_GROUP_ID = "001";
	private static final int FIRST_DATA_ROW_NO = 2;

	private final CastConfigMapper castConfigMapper;
	private final SessionService sessionService;

	@Override
	public CastConfigGroupListDto retrieveGroupList(CastConfigSearchDto searchDto) {
		CastConfigGroupListDto result = new CastConfigGroupListDto();
		if (searchDto.getTmnlId() == null) {
			return (CastConfigGroupListDto) result.error("터미널이 지정되지 않았습니다.");
		}

		result.setTmnlId(searchDto.getTmnlId());
		List<CastConfigGroupDto> groupList = new ArrayList<>();
		for (CastConfigGroup group : CastConfigGroup.values()) {
			CastConfigGroupDto groupDto = new CastConfigGroupDto();
			groupDto.setGroupId(group.getGroupId());
			groupDto.setGroupNm(group.getGroupNm());
			groupDto.setGroupNmEn(group.getGroupNmEn());
			groupDto.setGroupDesc(group.getGroupDesc());

			List<CastConfigDatasetSummaryDto> datasetList = new ArrayList<>();
			for (CastConfigSheet sheet : CastConfigSheet.values()) {
				if (!group.supports(sheet)) {
					continue;
				}

				int rowCnt = retrieveRows(sheet, group, searchDto.getTmnlId(), BASE_FIX_ATRB_GROUP_ID).size();
				if (rowCnt == 0) {
					continue;
				}

				CastConfigDatasetSummaryDto summary = new CastConfigDatasetSummaryDto();
				summary.setSheetNm(sheet.getSheetNm());
				summary.setRowCnt(rowCnt);
				datasetList.add(summary);
			}

			groupDto.setDatasetList(datasetList);
			groupList.add(groupDto);
		}

		result.setGroupList(groupList);
		return result;
	}

	@Override
	public CastConfigCategoryListDto retrieveCategoryList(CastConfigSearchDto searchDto) {
		CastConfigCategoryListDto result = new CastConfigCategoryListDto();
		List<CastConfigCategoryDto> categoryList = castConfigMapper.retrieveCategoryList();
		for (CastConfigCategoryDto category : categoryList) {
			category.setAtrbGroupNm(unblank(category.getAtrbGroupNm()));
			category.setGroupPrcsSttsCd(unblank(category.getGroupPrcsSttsCd()));
			category.setFrstRegDt(unblank(category.getFrstRegDt()));
		}
		result.setTotalCnt(categoryList.size());
		result.setCategoryList(categoryList);
		return result;
	}

	@Override
	public CastConfigDatasetDto retrieveDataset(CastConfigSearchDto searchDto) {
		CastConfigDatasetDto result = new CastConfigDatasetDto();
		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(searchDto.getSheetNm());
		if (sheet == null) {
			return datasetError(result, searchDto.getSheetNm(), "등록되지 않은 시트입니다.");
		}

		CastConfigGroup group = CastConfigGroup.fromGroupId(searchDto.getGroupId());
		if (group == null || !group.supports(sheet)) {
			return datasetError(result, sheet.getSheetNm(), "시설그룹에 연결되지 않은 원본 시트입니다.");
		}
		if (searchDto.getTmnlId() == null) {
			return datasetError(result, sheet.getSheetNm(), "터미널이 지정되지 않았습니다.");
		}
		if (isBlank(searchDto.getFixAtrbGroupId())) {
			return datasetError(result, sheet.getSheetNm(), "카테고리가 지정되지 않았습니다.");
		}

		List<CastConfigAtrbRawDto> rawList = retrieveRows(
				sheet,
				group,
				searchDto.getTmnlId(),
				searchDto.getFixAtrbGroupId()
		);

		result.setSheetNm(sheet.getSheetNm());
		result.setDimension("");
		result.setColumnList(toColumnList(sheet));
		result.setRowList(toRowList(sheet, rawList, BASE_FIX_ATRB_GROUP_ID.equals(searchDto.getFixAtrbGroupId())));
		result.setShapeColumn(sheet.getShapeColumn());
		result.setValidation(sheet.getValidation());
		return result;
	}

	@Override
	public JsonResponse saveDataset(CastConfigSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);
		if (isBlank(saveDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}
		if (saveDto.getTmnlId() == null) {
			return new JsonResponse().error("터미널이 지정되지 않았습니다.");
		}

		CastConfigGroup group = CastConfigGroup.fromGroupId(saveDto.getGroupId());
		if (group == null) {
			return new JsonResponse().error("시설그룹이 지정되지 않았습니다.");
		}
		if (saveDto.getItemList() == null || saveDto.getItemList().isEmpty()) {
			return new JsonResponse().error("저장할 변경 내용이 없습니다.");
		}

		Map<String, List<CastConfigSaveItemDto>> itemMap = new LinkedHashMap<>();
		for (CastConfigSaveItemDto item : saveDto.getItemList()) {
			String key = item.getFixAtrbGroupId() + "::" + item.getSheetNm();
			itemMap.computeIfAbsent(key, ignored -> new ArrayList<>()).add(item);
		}

		List<UpdateTarget> targets = new ArrayList<>();
		for (List<CastConfigSaveItemDto> itemList : itemMap.values()) {
			JsonResponse invalid = appendUpdateTargets(targets, group, saveDto.getTmnlId(), itemList);
			if (invalid != null) {
				return invalid;
			}
		}

		for (UpdateTarget target : targets) {
			int updated = update(target, saveDto.getLoginUserId(), saveDto.getLoginIpAddr());
			if (updated != 1) {
				return rollbackError("다른 사용자가 데이터를 변경했습니다. 다시 조회해 주세요.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public JsonResponse applyDefaultAttribute(CastConfigDefaultApplyDto applyDto) {
		SessionUtils.setUserContext(applyDto, sessionService);
		if (isBlank(applyDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}
		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(applyDto.getSheetNm());
		CastConfigGroup group = CastConfigGroup.fromGroupId(applyDto.getGroupId());
		if (sheet == null || group == null || !group.supports(sheet)) {
			return new JsonResponse().error("시설그룹에 연결되지 않은 원본 시트입니다.");
		}
		if (applyDto.getTmnlId() == null) {
			return new JsonResponse().error("터미널이 지정되지 않았습니다.");
		}
		if (BASE_FIX_ATRB_GROUP_ID.equals(applyDto.getFixAtrbGroupId())) {
			return new JsonResponse().error("기준정보는 수정할 수 없습니다.");
		}
		if (isBlank(applyDto.getFixAtrbGroupId())) {
			return new JsonResponse().error("카테고리가 지정되지 않았습니다.");
		}

		List<CastConfigAtrbRawDto> rowList = retrieveRows(
				sheet,
				group,
				applyDto.getTmnlId(),
				applyDto.getFixAtrbGroupId()
		);
		Set<Integer> selected = applyDto.getRowNoList() == null
				? Set.of()
				: new LinkedHashSet<>(applyDto.getRowNoList());
		if (!selected.isEmpty()) {
			for (Integer rowNo : selected) {
				if (rowNo == null || rowNo < FIRST_DATA_ROW_NO || rowNo >= FIRST_DATA_ROW_NO + rowList.size()) {
					return new JsonResponse().error("적용할 행을 찾지 못했습니다.");
				}
			}
		}

		List<String> valueColumns = valueColumns(sheet);
		for (int index = 0; index < rowList.size(); index++) {
			int rowNo = index + FIRST_DATA_ROW_NO;
			if (!selected.isEmpty() && !selected.contains(rowNo)) {
				continue;
			}

			CastConfigAtrbRawDto row = rowList.get(index);
			int updated = castConfigMapper.copyFromBaseGroup(
					sheet.getTableNm(),
					valueColumns,
					applyDto.getFixAtrbGroupId(),
					row.getAtrbCd(),
					row.getDtlSeCd(),
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm(),
					applyDto.getLoginUserId(),
					applyDto.getLoginIpAddr()
			);
			if (updated != 1) {
				return rollbackError("기준정보와 일치하는 행을 찾지 못했습니다.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public JsonResponse saveCategory(CastConfigCategorySaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);
		if (isBlank(saveDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}
		if (isBlank(saveDto.getFixAtrbGroupId()) || saveDto.getFixAtrbGroupId().length() > 8) {
			return new JsonResponse().error("카테고리 코드를 확인해 주세요.");
		}
		if (isBlank(saveDto.getAtrbGroupNm())) {
			return new JsonResponse().error("카테고리명을 입력해 주세요.");
		}
		if (saveDto.getFrstRegDt() == null || !saveDto.getFrstRegDt().matches("\\d{14}")) {
			return new JsonResponse().error("최초등록일시 형식을 확인해 주세요.");
		}
		if (castConfigMapper.retrieveCategoryCnt(saveDto.getFixAtrbGroupId()) > 0) {
			return new JsonResponse().error("이미 등록된 카테고리 코드입니다.");
		}

		Set<CastConfigSheet> sheetSet = new LinkedHashSet<>();
		if (saveDto.getSheetNmList() != null) {
			for (String sheetNm : saveDto.getSheetNmList()) {
				CastConfigSheet sheet = CastConfigSheet.fromSheetNm(sheetNm);
				if (sheet == null) {
					return new JsonResponse().error("등록되지 않은 시트가 포함되어 있습니다.");
				}
				sheetSet.add(sheet);
			}
		}
		if (sheetSet.isEmpty()) {
			return new JsonResponse().error("복사할 시트를 선택해 주세요.");
		}

		castConfigMapper.insertCategory(saveDto);
		for (CastConfigSheet sheet : sheetSet) {
			int inserted = castConfigMapper.insertFromBaseGroup(
					sheet.getTableNm(),
					valueColumns(sheet),
					saveDto.getFixAtrbGroupId(),
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm(),
					saveDto.getLoginUserId(),
					saveDto.getLoginIpAddr()
			);
			if (inserted == 0) {
				return rollbackError("기준정보에 복사할 시트 데이터가 없습니다.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public JsonResponse uploadExcel(
			String tmnlId,
			String groupId,
			String fixAtrbGroupId,
			String sheetNm,
			MultipartFile file
	) {
		TerminalKind terminal;
		try {
			terminal = TerminalKind.valueOf(tmnlId);
		} catch (RuntimeException exception) {
			return new JsonResponse().error("터미널을 확인해 주세요.");
		}

		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(sheetNm);
		CastConfigGroup group = CastConfigGroup.fromGroupId(groupId);
		if (sheet == null || group == null || !group.supports(sheet)) {
			return new JsonResponse().error("시설그룹에 연결되지 않은 원본 시트입니다.");
		}
		if (file == null || file.isEmpty()) {
			return new JsonResponse().error("업로드할 파일이 없습니다.");
		}

		CastConfigSaveDto saveDto = new CastConfigSaveDto();
		saveDto.setTmnlId(terminal);
		saveDto.setGroupId(groupId);
		try (InputStream input = file.getInputStream(); Workbook workbook = WorkbookFactory.create(input)) {
			saveDto.setItemList(toExcelItems(workbook, sheet, fixAtrbGroupId));
		} catch (Exception exception) {
			return new JsonResponse().error("엑셀 파일을 읽지 못했습니다.");
		}
		if (saveDto.getItemList().isEmpty()) {
			return new JsonResponse().error("엑셀에 반영할 값이 없습니다.");
		}

		return saveDataset(saveDto);
	}

	private JsonResponse appendUpdateTargets(
			List<UpdateTarget> targets,
			CastConfigGroup group,
			TerminalKind tmnlId,
			List<CastConfigSaveItemDto> itemList
	) {
		CastConfigSaveItemDto first = itemList.get(0);
		if (BASE_FIX_ATRB_GROUP_ID.equals(first.getFixAtrbGroupId())) {
			return new JsonResponse().error("기준정보는 수정할 수 없습니다.");
		}

		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(first.getSheetNm());
		if (sheet == null || !group.supports(sheet)) {
			return new JsonResponse().error("시설그룹에 연결되지 않은 원본 시트입니다.");
		}

		List<CastConfigAtrbRawDto> rowList = retrieveRows(sheet, group, tmnlId, first.getFixAtrbGroupId());
		for (CastConfigSaveItemDto item : itemList) {
			if (item.getRowNo() < FIRST_DATA_ROW_NO || item.getRowNo() >= FIRST_DATA_ROW_NO + rowList.size()) {
				return new JsonResponse().error("다른 사용자가 데이터를 변경했습니다. 다시 조회해 주세요.");
			}
			CastConfigColumnDef column = sheet.getColumn(item.getColumn());
			if (column == null || !column.isEditable()) {
				return new JsonResponse().error("수정할 수 없는 원본 셀이 포함되어 있습니다.");
			}

			CastConfigAtrbRawDto row = rowList.get(item.getRowNo() - FIRST_DATA_ROW_NO);
			JsonResponse invalid = validateValue(column, row, item.getValue());
			if (invalid != null) {
				return invalid;
			}
			targets.add(new UpdateTarget(sheet, column, first.getFixAtrbGroupId(), row, item.getValue()));
		}

		return null;
	}

	private JsonResponse validateValue(CastConfigColumnDef column, CastConfigAtrbRawDto row, String value) {
		if (column.getType() == CastConfigColumnType.NUMBER && !isBlank(value)) {
			try {
				new BigDecimal(value.trim());
			} catch (NumberFormatException exception) {
				return new JsonResponse().error(column.getLabel() + " 값은 숫자여야 합니다.");
			}
		}

		if (!"INPT_VL".equals(column.getPhysicalColumn()) || isBlank(value)) {
			return null;
		}
		if ("Integer".equalsIgnoreCase(row.getCatalogVlType())) {
			try {
				if (new BigDecimal(value.trim()).stripTrailingZeros().scale() > 0) {
					return new JsonResponse().error(column.getLabel() + " 값은 정수여야 합니다.");
				}
			} catch (NumberFormatException exception) {
				return new JsonResponse().error(column.getLabel() + " 값은 정수여야 합니다.");
			}
		}
		if ("Float".equalsIgnoreCase(row.getCatalogVlType())) {
			try {
				new BigDecimal(value.trim());
			} catch (NumberFormatException exception) {
				return new JsonResponse().error(column.getLabel() + " 값은 숫자여야 합니다.");
			}
		}
		return null;
	}

	private int update(UpdateTarget target, String loginUserId, String loginIpAddr) {
		CastConfigSheet sheet = target.getSheet();
		CastConfigColumnDef column = target.getColumn();
		CastConfigAtrbRawDto row = target.getRow();
		if (isPhysicalNumberColumn(column.getPhysicalColumn())) {
			BigDecimal value = isBlank(target.getValue()) ? null : new BigDecimal(target.getValue().trim());
			return castConfigMapper.updateAtrbNumberValue(
					sheet.getTableNm(),
					column.getPhysicalColumn(),
					value,
					target.getFixAtrbGroupId(),
					row.getAtrbCd(),
					row.getDtlSeCd(),
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm(),
					loginUserId,
					loginIpAddr
			);
		}

		return castConfigMapper.updateAtrbTextValue(
				sheet.getTableNm(),
				column.getPhysicalColumn(),
				target.getValue(),
				target.getFixAtrbGroupId(),
				row.getAtrbCd(),
				row.getDtlSeCd(),
				sheet.getKeyColumnNm(),
				sheet.getDtlColumnNm(),
				loginUserId,
				loginIpAddr
		);
	}

	private List<CastConfigAtrbRawDto> retrieveRows(
			CastConfigSheet sheet,
			CastConfigGroup group,
			TerminalKind tmnlId,
			String fixAtrbGroupId
	) {
		List<String> filterList = new ArrayList<>(group.getRootCdSet(sheet));
		if (sheet.getCatalogKind() == CastConfigCatalogKind.PSG_FIX) {
			return castConfigMapper.retrievePsgAtrbList(
					sheet.getTableNm(),
					fixAtrbGroupId,
					tmnlId.getValue(),
					filterList
			);
		}
		if (filterList.isEmpty()) {
			return List.of();
		}
		return castConfigMapper.retrieveSrvcAtrbList(fixAtrbGroupId, filterList);
	}

	private List<CastConfigColumnDto> toColumnList(CastConfigSheet sheet) {
		List<CastConfigColumnDto> result = new ArrayList<>();
		for (CastConfigColumnDef definition : sheet.getColumnList()) {
			CastConfigColumnDto column = new CastConfigColumnDto();
			column.setColumn(definition.getColumn());
			column.setLabel(definition.getLabel());
			column.setType(definition.getType().name());
			column.setOptionList(new ArrayList<>(definition.getOptionList()));
			column.setMergeYn(definition.isMerge() ? "Y" : "N");
			result.add(column);
		}
		return result;
	}

	private List<CastConfigGridRowDto> toRowList(
			CastConfigSheet sheet,
			List<CastConfigAtrbRawDto> rawList,
			boolean base
	) {
		List<CastConfigGridRowDto> result = new ArrayList<>();
		for (int index = 0; index < rawList.size(); index++) {
			CastConfigAtrbRawDto raw = rawList.get(index);
			CastConfigGridRowDto row = new CastConfigGridRowDto();
			row.setRowNo(index + FIRST_DATA_ROW_NO);
			List<CastConfigGridCellDto> cellList = new ArrayList<>();
			for (CastConfigColumnDef definition : sheet.getColumnList()) {
				CastConfigGridCellDto cell = new CastConfigGridCellDto();
				cell.setColumn(definition.getColumn());
				cell.setValue(rawValue(raw, definition.getPhysicalColumn()));
				cell.setFormula("");
				cell.setEditableYn(!base && definition.isEditable() ? "Y" : "N");
				cellList.add(cell);
			}
			row.setCellList(cellList);
			result.add(row);
		}
		return result;
	}

	private List<CastConfigSaveItemDto> toExcelItems(
			Workbook workbook,
			CastConfigSheet sheet,
			String fixAtrbGroupId
	) {
		if (workbook.getNumberOfSheets() == 0) {
			return List.of();
		}
		org.apache.poi.ss.usermodel.Sheet excelSheet = workbook.getSheetAt(0);
		Row header = excelSheet.getRow(0);
		if (header == null) {
			return List.of();
		}

		DataFormatter formatter = new DataFormatter();
		Map<Integer, CastConfigColumnDef> columnMap = new LinkedHashMap<>();
		for (int index = 0; index < header.getLastCellNum(); index++) {
			CastConfigColumnDef column = sheet.getColumn(formatter.formatCellValue(header.getCell(index)).trim());
			if (column != null && column.isEditable()) {
				columnMap.put(index, column);
			}
		}

		List<CastConfigSaveItemDto> result = new ArrayList<>();
		for (int rowIndex = 1; rowIndex <= excelSheet.getLastRowNum(); rowIndex++) {
			Row row = excelSheet.getRow(rowIndex);
			if (row == null) {
				continue;
			}
			for (Map.Entry<Integer, CastConfigColumnDef> entry : columnMap.entrySet()) {
				CastConfigSaveItemDto item = new CastConfigSaveItemDto();
				item.setFixAtrbGroupId(fixAtrbGroupId);
				item.setSheetNm(sheet.getSheetNm());
				item.setRowNo(rowIndex + 1);
				item.setColumn(entry.getValue().getColumn());
				item.setValue(formatter.formatCellValue(row.getCell(entry.getKey())).trim());
				result.add(item);
			}
		}
		return result;
	}

	private String rawValue(CastConfigAtrbRawDto raw, String physicalColumn) {
		switch (physicalColumn) {
			case "PSG_ATRB_CD":
			case "FCLTY_SE_CD":
				return unblank(raw.getAtrbCdNm());
			case "PSG_DTL_SE_CD":
			case "FCLTY_DTL_CD":
				return unblank(raw.getDtlSeCdNm());
			case "INPT_VL":
				return unblank(raw.getInptVl());
			case "USER_DEF_1_VL":
				return unblank(raw.getUserDef1Vl());
			case "USER_DEF_2_VL":
				return unblank(raw.getUserDef2Vl());
			case "MIN_VL":
				return decimal(raw.getMinVl());
			case "MAX_VL":
				return decimal(raw.getMaxVl());
			case "DSTB_MAX_VL":
				return decimal(raw.getDstbMaxVl());
			case "VL_TYPE":
				return unblank(raw.getVlType());
			case "SWTC_FNC_ID":
				return unblank(raw.getSwtcFncId());
			case "VRFC_FNC_ID":
				return unblank(raw.getVrfcFncId());
			default:
				return "";
		}
	}

	private List<String> valueColumns(CastConfigSheet sheet) {
		return sheet.getColumnList().stream()
				.filter(CastConfigColumnDef::isEditable)
				.map(CastConfigColumnDef::getPhysicalColumn)
				.distinct()
				.collect(Collectors.toList());
	}

	private CastConfigDatasetDto datasetError(CastConfigDatasetDto result, String sheetNm, String message) {
		result.setSheetNm(sheetNm == null ? "" : sheetNm);
		return (CastConfigDatasetDto) result.error(message);
	}

	private JsonResponse rollbackError(String message) {
		TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
		return new JsonResponse().error(message);
	}

	private boolean isPhysicalNumberColumn(String physicalColumn) {
		return "MIN_VL".equals(physicalColumn)
				|| "MAX_VL".equals(physicalColumn)
				|| "DSTB_MAX_VL".equals(physicalColumn);
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private String unblank(String value) {
		return value == null || value.trim().isEmpty() ? "" : value.trim();
	}

	private String decimal(BigDecimal value) {
		return value == null ? "" : value.stripTrailingZeros().toPlainString();
	}

	@Getter
	private static class UpdateTarget {
		private final CastConfigSheet sheet;
		private final CastConfigColumnDef column;
		private final String fixAtrbGroupId;
		private final CastConfigAtrbRawDto row;
		private final String value;

		UpdateTarget(
				CastConfigSheet sheet,
				CastConfigColumnDef column,
				String fixAtrbGroupId,
				CastConfigAtrbRawDto row,
				String value
		) {
			this.sheet = sheet;
			this.column = column;
			this.fixAtrbGroupId = fixAtrbGroupId;
			this.row = row;
			this.value = value == null ? "" : value;
		}
	}
}
