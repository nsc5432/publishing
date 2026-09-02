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
import aoms.pm.cast.dto.CastConfigAplyHstryDtlDto;
import aoms.pm.cast.dto.CastConfigAplyHstryDto;
import aoms.pm.cast.dto.CastConfigAplyHstryListDto;
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
import aoms.pm.cast.dto.CastConfigPreProcessApplyDto;
import aoms.pm.cast.dto.CastConfigPreProcessDiffDto;
import aoms.pm.cast.dto.CastConfigPreProcessRevertDto;
import aoms.pm.cast.dto.CastConfigPreProcessRowDto;
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
import aoms.pm.utils.StringUtils;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastConfigServiceImpl implements CastConfigService {
	private static final String BASE_FIX_ATRB_GROUP_ID = "001";
	/** 전처리 파이프라인(data-processing)이 주단위로 갈아 끼우는 속성그룹 */
	private static final String PRE_PRCS_FIX_ATRB_GROUP_ID = "999";
	private static final String INPT_VL_COLUMN = "INPT_VL";
	private static final String VL_TYPE_INTEGER = "Integer";
	private static final String VL_TYPE_FLOAT = "Float";
	private static final String YN_Y = "Y";
	private static final String YN_N = "N";
	private static final String FRST_REG_DT_PATTERN = "\\d{14}";
	private static final Set<String> NUMBER_COLUMN_SET = Set.of("MIN_VL", "MAX_VL", "DSTB_MAX_VL");

	/** 격자 첫 데이터 행 번호 — 1행은 머리글이다 */
	private static final int FIRST_DATA_ROW_NO = 2;
	private static final int FIX_ATRB_GROUP_ID_MAX_LENGTH = 8;

	private final CastConfigMapper castConfigMapper;
	private final SessionService sessionService;

	@Override
	public CastConfigGroupListDto retrieveGroupList(CastConfigSearchDto searchDto) {
		CastConfigGroupListDto result = new CastConfigGroupListDto();

		if (searchDto.getTmnlId() == null) {
			return (CastConfigGroupListDto) result.error("터미널이 지정되지 않았습니다.");
		}

		List<CastConfigGroupDto> groupList = new ArrayList<>();

		for (CastConfigGroup group : CastConfigGroup.values()) {
			CastConfigGroupDto groupDto = new CastConfigGroupDto();
			groupDto.setGroupId(group.getGroupId());
			groupDto.setGroupNm(group.getGroupNm());
			groupDto.setGroupNmEn(group.getGroupNmEn());
			groupDto.setGroupDesc(group.getGroupDesc());
			groupDto.setDatasetList(getDatasetList(group, searchDto.getTmnlId()));

			groupList.add(groupDto);
		}

		result.setTmnlId(searchDto.getTmnlId());
		result.setGroupList(groupList);

		return result;
	}

	@Override
	public CastConfigCategoryListDto retrieveCategoryList(CastConfigSearchDto searchDto) {
		CastConfigCategoryListDto result = new CastConfigCategoryListDto();
		List<CastConfigCategoryDto> categoryList = castConfigMapper.retrieveCategoryList(
				BASE_FIX_ATRB_GROUP_ID,
				PRE_PRCS_FIX_ATRB_GROUP_ID
		);

		for (CastConfigCategoryDto category : categoryList) {
			category.setAtrbGroupNm(StringUtils.trimToEmpty(category.getAtrbGroupNm()));
			category.setGroupPrcsSttsCd(StringUtils.trimToEmpty(category.getGroupPrcsSttsCd()));
			category.setFrstRegDt(StringUtils.trimToEmpty(category.getFrstRegDt()));
			category.setLastMdfcnDt(StringUtils.trimToEmpty(category.getLastMdfcnDt()));
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

		if (StringUtils.isBlank(searchDto.getFixAtrbGroupId())) {
			return datasetError(result, sheet.getSheetNm(), "카테고리가 지정되지 않았습니다.");
		}

		List<CastConfigAtrbRawDto> rawList = retrieveRows(
				sheet,
				group,
				searchDto.getTmnlId(),
				searchDto.getFixAtrbGroupId()
		);
		boolean isBaseGroup = BASE_FIX_ATRB_GROUP_ID.equals(searchDto.getFixAtrbGroupId());

		result.setSheetNm(sheet.getSheetNm());
		result.setDimension("");
		result.setColumnList(toColumnList(sheet));
		result.setRowList(toRowList(sheet, rawList, isBaseGroup));
		result.setShapeColumn(sheet.getShapeColumn());
		result.setValidation(sheet.getValidation());

		return result;
	}

	@Override
	public JsonResponse saveDataset(CastConfigSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		if (StringUtils.isBlank(saveDto.getLoginUserId())) {
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

		// 카테고리 · 시트가 같은 항목끼리 묶어야 행 목록을 한 번만 읽고 행 번호를 맞출 수 있다
		Map<String, List<CastConfigSaveItemDto>> itemMap = new LinkedHashMap<>();

		for (CastConfigSaveItemDto item : saveDto.getItemList()) {
			String key = item.getFixAtrbGroupId() + "::" + item.getSheetNm();
			itemMap.computeIfAbsent(key, ignored -> new ArrayList<>()).add(item);
		}

		List<UpdateTarget> updateTargetList = new ArrayList<>();

		for (List<CastConfigSaveItemDto> itemList : itemMap.values()) {
			JsonResponse validationError =
					appendUpdateTargets(updateTargetList, group, saveDto.getTmnlId(), itemList);

			if (validationError != null) {
				return validationError;
			}
		}

		for (UpdateTarget target : updateTargetList) {
			if (update(target, saveDto.getLoginUserId(), saveDto.getLoginIpAddr()) != 1) {
				return rollbackError("다른 사용자가 데이터를 변경했습니다. 다시 조회해 주세요.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public JsonResponse applyDefaultAttribute(CastConfigDefaultApplyDto applyDto) {
		SessionUtils.setUserContext(applyDto, sessionService);

		if (StringUtils.isBlank(applyDto.getLoginUserId())) {
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

		if (StringUtils.isBlank(applyDto.getFixAtrbGroupId())) {
			return new JsonResponse().error("카테고리가 지정되지 않았습니다.");
		}

		List<CastConfigAtrbRawDto> rowList = retrieveRows(
				sheet,
				group,
				applyDto.getTmnlId(),
				applyDto.getFixAtrbGroupId()
		);
		// 선택 행이 없으면 시트 전체를 되돌린다
		Set<Integer> selectedRowNoSet = applyDto.getRowNoList() == null
				? Set.of()
				: new LinkedHashSet<>(applyDto.getRowNoList());

		for (Integer rowNo : selectedRowNoSet) {
			if (rowNo == null || rowNo < FIRST_DATA_ROW_NO || rowNo >= FIRST_DATA_ROW_NO + rowList.size()) {
				return new JsonResponse().error("적용할 행을 찾지 못했습니다.");
			}
		}

		List<String> valueColumnList = getValueColumnList(sheet);

		for (int index = 0; index < rowList.size(); index++) {
			int rowNo = index + FIRST_DATA_ROW_NO;

			if (!selectedRowNoSet.isEmpty() && !selectedRowNoSet.contains(rowNo)) {
				continue;
			}

			CastConfigAtrbRawDto row = rowList.get(index);
			int updated = castConfigMapper.copyFromGroup(
					sheet.getTableNm(),
					valueColumnList,
					BASE_FIX_ATRB_GROUP_ID,
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
	public CastConfigPreProcessDiffDto retrievePreProcessDiff(CastConfigSearchDto searchDto) {
		CastConfigPreProcessDiffDto result = new CastConfigPreProcessDiffDto();
		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(searchDto.getSheetNm());
		CastConfigGroup group = CastConfigGroup.fromGroupId(searchDto.getGroupId());

		if (sheet == null || group == null || !group.supports(sheet)) {
			result.setSheetNm(searchDto.getSheetNm() == null ? "" : searchDto.getSheetNm());
			return (CastConfigPreProcessDiffDto) result.error("시설그룹에 연결되지 않은 원본 시트입니다.");
		}

		if (searchDto.getTmnlId() == null) {
			result.setSheetNm(sheet.getSheetNm());
			return (CastConfigPreProcessDiffDto) result.error("터미널이 지정되지 않았습니다.");
		}

		List<CastConfigAtrbRawDto> baseList =
				retrieveRows(sheet, group, searchDto.getTmnlId(), BASE_FIX_ATRB_GROUP_ID);
		Map<String, CastConfigAtrbRawDto> preMap = toRowMap(
				retrieveRows(sheet, group, searchDto.getTmnlId(), PRE_PRCS_FIX_ATRB_GROUP_ID)
		);

		List<CastConfigPreProcessRowDto> rowList = new ArrayList<>();
		int changedCnt = 0;

		// 행 번호는 격자와 같은 좌표계를 써야 applyPreProcess 의 rowNoList 가 통한다.
		// 그래서 전처리 대상만 남기기 전에 001 전체 목록에서 번호를 먼저 매긴다.
		for (int index = 0; index < baseList.size(); index++) {
			CastConfigAtrbRawDto base = baseList.get(index);

			if (!YN_Y.equals(base.getPrePrcsYn())) {
				continue;
			}

			CastConfigAtrbRawDto pre = preMap.get(toRowKey(base));
			String baseVl = StringUtils.trimToEmpty(base.getInptVl());
			String preVl = pre == null ? "" : StringUtils.trimToEmpty(pre.getInptVl());

			CastConfigPreProcessRowDto row = new CastConfigPreProcessRowDto();
			row.setRowNo(index + FIRST_DATA_ROW_NO);
			row.setAtrbCd(StringUtils.trimToEmpty(base.getAtrbCd()));
			row.setDtlSeCd(StringUtils.trimToEmpty(base.getDtlSeCd()));
			row.setAtrbCdNm(StringUtils.trimToEmpty(base.getAtrbCdNm()));
			row.setDtlSeCdNm(StringUtils.trimToEmpty(base.getDtlSeCdNm()));
			row.setBaseVl(baseVl);
			row.setPreVl(preVl);
			row.setMatchedYn(pre == null ? YN_N : YN_Y);
			row.setChangedYn(pre != null && !baseVl.equals(preVl) ? YN_Y : YN_N);

			if (YN_Y.equals(row.getChangedYn())) {
				changedCnt++;
			}

			rowList.add(row);
		}

		CastConfigColumnDef valueColumn = findColumnByPhysical(sheet, INPT_VL_COLUMN);
		CastConfigCategoryDto preCategory = findPreProcessCategory();

		result.setSheetNm(sheet.getSheetNm());
		result.setValueColumn(INPT_VL_COLUMN);
		result.setValueLabel(valueColumn == null ? INPT_VL_COLUMN_LABEL : valueColumn.getLabel());
		result.setChangedCnt(changedCnt);
		result.setRowList(rowList);
		result.setPreProcessNm(preCategory == null ? "" : preCategory.getAtrbGroupNm());
		result.setPreProcessDt(preCategory == null ? "" : preCategory.getLastMdfcnDt());

		return result;
	}

	@Override
	public JsonResponse applyPreProcess(CastConfigPreProcessApplyDto applyDto) {
		SessionUtils.setUserContext(applyDto, sessionService);

		if (StringUtils.isBlank(applyDto.getLoginUserId())) {
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

		if (applyDto.getRowNoList() == null || applyDto.getRowNoList().isEmpty()) {
			return new JsonResponse().error("반영할 행을 선택해 주세요.");
		}

		List<CastConfigAtrbRawDto> baseList =
				retrieveRows(sheet, group, applyDto.getTmnlId(), BASE_FIX_ATRB_GROUP_ID);
		Map<String, CastConfigAtrbRawDto> preMap = toRowMap(
				retrieveRows(sheet, group, applyDto.getTmnlId(), PRE_PRCS_FIX_ATRB_GROUP_ID)
		);
		Set<Integer> selectedRowNoSet = new LinkedHashSet<>(applyDto.getRowNoList());

		for (Integer rowNo : selectedRowNoSet) {
			if (rowNo == null || rowNo < FIRST_DATA_ROW_NO || rowNo >= FIRST_DATA_ROW_NO + baseList.size()) {
				return new JsonResponse().error("반영할 행을 찾지 못했습니다.");
			}
		}

		List<CastConfigAtrbRawDto> targetList = new ArrayList<>();

		for (Integer rowNo : selectedRowNoSet) {
			CastConfigAtrbRawDto base = baseList.get(rowNo - FIRST_DATA_ROW_NO);

			if (!YN_Y.equals(base.getPrePrcsYn())) {
				return new JsonResponse().error("전처리 대상이 아닌 행이 포함되어 있습니다.");
			}

			if (!preMap.containsKey(toRowKey(base))) {
				return new JsonResponse().error("전처리 결과에 없는 행이 포함되어 있습니다.");
			}

			targetList.add(base);
		}

		long aplySn = castConfigMapper.retrieveAplyHstrySn();
		CastConfigAplyHstryDto hstry = new CastConfigAplyHstryDto();
		hstry.setAplySn(aplySn);
		hstry.setSrcFixAtrbGroupId(PRE_PRCS_FIX_ATRB_GROUP_ID);
		hstry.setTgtFixAtrbGroupId(BASE_FIX_ATRB_GROUP_ID);
		hstry.setTmnlId(applyDto.getTmnlId().getValue());
		hstry.setTblNm(sheet.getTableNm());
		hstry.setSheetNm(sheet.getSheetNm());
		hstry.setAplyRowCnt(targetList.size());
		hstry.setLoginUserId(applyDto.getLoginUserId());
		hstry.setLoginIpAddr(applyDto.getLoginIpAddr());
		castConfigMapper.insertAplyHstry(hstry);

		// 파이프라인이 채우는 것은 INPT_VL 뿐이다. 사용자정의값까지 복사하면 999 의 NULL 이
		// 기준정보를 비운다. 비교표가 보여 주는 열과도 이 목록이 같아야 한다.
		List<String> valueColumnList = List.of(INPT_VL_COLUMN);

		// 스냅샷을 먼저 남긴다. 복사 뒤에 찍으면 되돌릴 값이 이미 덮여 있다.
		for (CastConfigAtrbRawDto row : targetList) {
			castConfigMapper.insertAplyHstryDtl(
					aplySn,
					sheet.getTableNm(),
					valueColumnList,
					PRE_PRCS_FIX_ATRB_GROUP_ID,
					BASE_FIX_ATRB_GROUP_ID,
					row.getAtrbCd(),
					row.getDtlSeCd(),
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm()
			);
		}

		for (CastConfigAtrbRawDto row : targetList) {
			int updated = castConfigMapper.copyFromGroup(
					sheet.getTableNm(),
					valueColumnList,
					PRE_PRCS_FIX_ATRB_GROUP_ID,
					BASE_FIX_ATRB_GROUP_ID,
					row.getAtrbCd(),
					row.getDtlSeCd(),
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm(),
					applyDto.getLoginUserId(),
					applyDto.getLoginIpAddr()
			);

			if (updated != 1) {
				return rollbackError("전처리 결과와 일치하는 행을 찾지 못했습니다.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public CastConfigAplyHstryListDto retrievePreProcessHistory(CastConfigSearchDto searchDto) {
		CastConfigAplyHstryListDto result = new CastConfigAplyHstryListDto();
		List<CastConfigAplyHstryDto> hstryList = castConfigMapper.retrieveAplyHstryList(
				BASE_FIX_ATRB_GROUP_ID,
				searchDto.getTmnlId() == null ? null : searchDto.getTmnlId().getValue(),
				StringUtils.trimToEmpty(searchDto.getSheetNm())
		);

		result.setTotalCnt(hstryList.size());
		result.setHstryList(hstryList);

		return result;
	}

	@Override
	public JsonResponse revertPreProcess(CastConfigPreProcessRevertDto revertDto) {
		SessionUtils.setUserContext(revertDto, sessionService);

		if (StringUtils.isBlank(revertDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		CastConfigAplyHstryDto hstry = castConfigMapper.retrieveAplyHstry(revertDto.getAplySn());

		if (hstry == null) {
			return new JsonResponse().error("반영 이력을 찾지 못했습니다.");
		}

		if (YN_Y.equals(hstry.getCnclYn())) {
			return new JsonResponse().error("이미 되돌린 이력입니다.");
		}

		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(hstry.getSheetNm());

		if (sheet == null) {
			return new JsonResponse().error("등록되지 않은 시트입니다.");
		}

		// 다른 경로가 먼저 되돌렸으면 여기서 0행이 되고, 값은 손대지 않는다.
		if (castConfigMapper.updateAplyHstryCancel(revertDto.getAplySn(), revertDto.getLoginUserId()) != 1) {
			return new JsonResponse().error("이미 되돌린 이력입니다.");
		}

		for (CastConfigAplyHstryDtlDto detail : castConfigMapper.retrieveAplyHstryDtlList(revertDto.getAplySn())) {
			CastConfigColumnDef column = findColumnByPhysical(sheet, detail.getColumnNm());

			if (column == null) {
				return rollbackError("되돌릴 수 없는 컬럼이 포함되어 있습니다.");
			}

			int updated = castConfigMapper.updateAtrbValue(
					sheet.getTableNm(),
					detail.getColumnNm(),
					toColumnValue(detail.getColumnNm(), detail.getBefVl()),
					hstry.getTgtFixAtrbGroupId(),
					detail.getAtrbCd(),
					detail.getDtlSeCd(),
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm(),
					revertDto.getLoginUserId(),
					revertDto.getLoginIpAddr()
			);

			if (updated != 1) {
				return rollbackError("되돌릴 행을 찾지 못했습니다.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public JsonResponse saveCategory(CastConfigCategorySaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		if (StringUtils.isBlank(saveDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (StringUtils.isBlank(saveDto.getFixAtrbGroupId())
				|| saveDto.getFixAtrbGroupId().length() > FIX_ATRB_GROUP_ID_MAX_LENGTH) {
			return new JsonResponse().error("카테고리 코드를 확인해 주세요.");
		}

		if (StringUtils.isBlank(saveDto.getAtrbGroupNm())) {
			return new JsonResponse().error("카테고리명을 입력해 주세요.");
		}

		if (saveDto.getFrstRegDt() == null || !saveDto.getFrstRegDt().matches(FRST_REG_DT_PATTERN)) {
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
					getValueColumnList(sheet),
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
		TerminalKind terminalKind;

		try {
			terminalKind = TerminalKind.valueOf(tmnlId);
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
		saveDto.setTmnlId(terminalKind);
		saveDto.setGroupId(groupId);

		try (InputStream inputStream = file.getInputStream();
				Workbook workbook = WorkbookFactory.create(inputStream)) {
			saveDto.setItemList(toExcelItemList(workbook, sheet, fixAtrbGroupId));
		} catch (Exception exception) {
			return new JsonResponse().error("엑셀 파일을 읽지 못했습니다.");
		}

		if (saveDto.getItemList().isEmpty()) {
			return new JsonResponse().error("엑셀에 반영할 값이 없습니다.");
		}

		// 엑셀은 입력 경로만 다를 뿐 저장 규칙은 격자 저장과 같아야 한다
		return saveDataset(saveDto);
	}

	// 행이 하나도 없는 시트는 화면에 걸지 않는다
	private List<CastConfigDatasetSummaryDto> getDatasetList(CastConfigGroup group, TerminalKind tmnlId) {
		List<CastConfigDatasetSummaryDto> result = new ArrayList<>();

		for (CastConfigSheet sheet : CastConfigSheet.values()) {
			if (!group.supports(sheet)) {
				continue;
			}

			int rowCnt = retrieveRows(sheet, group, tmnlId, BASE_FIX_ATRB_GROUP_ID).size();

			if (rowCnt == 0) {
				continue;
			}

			CastConfigDatasetSummaryDto summary = new CastConfigDatasetSummaryDto();
			summary.setSheetNm(sheet.getSheetNm());
			summary.setRowCnt(rowCnt);

			result.add(summary);
		}

		return result;
	}

	// 통과하면 null. 검사를 통과한 항목만 targetList 에 쌓는다
	private JsonResponse appendUpdateTargets(
			List<UpdateTarget> targetList,
			CastConfigGroup group,
			TerminalKind tmnlId,
			List<CastConfigSaveItemDto> itemList
	) {
		// 같은 (카테고리, 시트) 로 묶여 온 항목이라 첫 건의 조건이 목록 전체의 조건이다
		CastConfigSaveItemDto firstItem = itemList.get(0);

		if (BASE_FIX_ATRB_GROUP_ID.equals(firstItem.getFixAtrbGroupId())) {
			return new JsonResponse().error("기준정보는 수정할 수 없습니다.");
		}

		CastConfigSheet sheet = CastConfigSheet.fromSheetNm(firstItem.getSheetNm());

		if (sheet == null || !group.supports(sheet)) {
			return new JsonResponse().error("시설그룹에 연결되지 않은 원본 시트입니다.");
		}

		List<CastConfigAtrbRawDto> rowList = retrieveRows(sheet, group, tmnlId, firstItem.getFixAtrbGroupId());

		for (CastConfigSaveItemDto item : itemList) {
			if (item.getRowNo() < FIRST_DATA_ROW_NO || item.getRowNo() >= FIRST_DATA_ROW_NO + rowList.size()) {
				return new JsonResponse().error("다른 사용자가 데이터를 변경했습니다. 다시 조회해 주세요.");
			}

			CastConfigColumnDef column = sheet.getColumn(item.getColumn());

			if (column == null || !column.isEditable()) {
				return new JsonResponse().error("수정할 수 없는 원본 셀이 포함되어 있습니다.");
			}

			CastConfigAtrbRawDto row = rowList.get(item.getRowNo() - FIRST_DATA_ROW_NO);
			JsonResponse validationError = validateValue(column, row, item.getValue());

			if (validationError != null) {
				return validationError;
			}

			targetList.add(new UpdateTarget(sheet, column, firstItem.getFixAtrbGroupId(), row, item.getValue()));
		}

		return null;
	}

	// 통과하면 null
	private JsonResponse validateValue(CastConfigColumnDef column, CastConfigAtrbRawDto row, String value) {
		if (column.getType() == CastConfigColumnType.NUMBER && !StringUtils.isBlank(value)) {
			try {
				new BigDecimal(value.trim());
			} catch (NumberFormatException exception) {
				return new JsonResponse().error(column.getLabel() + " 값은 숫자여야 합니다.");
			}
		}

		// 입력값 컬럼만 카탈로그가 정한 자료형(Integer / Float)을 추가로 지킨다
		if (!INPT_VL_COLUMN.equals(column.getPhysicalColumn()) || StringUtils.isBlank(value)) {
			return null;
		}

		if (VL_TYPE_INTEGER.equalsIgnoreCase(row.getCatalogVlType())) {
			try {
				if (new BigDecimal(value.trim()).stripTrailingZeros().scale() > 0) {
					return new JsonResponse().error(column.getLabel() + " 값은 정수여야 합니다.");
				}
			} catch (NumberFormatException exception) {
				return new JsonResponse().error(column.getLabel() + " 값은 정수여야 합니다.");
			}
		}

		if (VL_TYPE_FLOAT.equalsIgnoreCase(row.getCatalogVlType())) {
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

		return castConfigMapper.updateAtrbValue(
				sheet.getTableNm(),
				column.getPhysicalColumn(),
				toColumnValue(column.getPhysicalColumn(), target.getValue()),
				target.getFixAtrbGroupId(),
				row.getAtrbCd(),
				row.getDtlSeCd(),
				sheet.getKeyColumnNm(),
				sheet.getDtlColumnNm(),
				loginUserId,
				loginIpAddr
		);
	}

	private Object toColumnValue(String physicalColumn, String value) {
		if (!NUMBER_COLUMN_SET.contains(physicalColumn)) {
			return value;
		}

		return StringUtils.isBlank(value) ? null : new BigDecimal(value.trim());
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
			column.setMergeYn(definition.isMerge() ? YN_Y : YN_N);

			result.add(column);
		}

		return result;
	}

	// 기준정보(001) 는 어떤 셀도 고칠 수 없다
	private List<CastConfigGridRowDto> toRowList(
			CastConfigSheet sheet,
			List<CastConfigAtrbRawDto> rawList,
			boolean isBaseGroup
	) {
		List<CastConfigGridRowDto> result = new ArrayList<>();

		for (int index = 0; index < rawList.size(); index++) {
			CastConfigAtrbRawDto raw = rawList.get(index);
			List<CastConfigGridCellDto> cellList = new ArrayList<>();

			for (CastConfigColumnDef definition : sheet.getColumnList()) {
				CastConfigGridCellDto cell = new CastConfigGridCellDto();
				cell.setColumn(definition.getColumn());
				cell.setValue(toCellValue(raw, definition.getPhysicalColumn()));
				cell.setFormula("");
				cell.setEditableYn(!isBaseGroup && definition.isEditable() ? YN_Y : YN_N);

				cellList.add(cell);
			}

			CastConfigGridRowDto row = new CastConfigGridRowDto();
			row.setRowNo(index + FIRST_DATA_ROW_NO);
			row.setCellList(cellList);

			result.add(row);
		}

		return result;
	}

	// 첫 시트만 읽는다. 머리글로 열을 찾으므로 열 순서가 달라도 되지만 이름은 격자와 같아야 한다
	private List<CastConfigSaveItemDto> toExcelItemList(
			Workbook workbook,
			CastConfigSheet sheet,
			String fixAtrbGroupId
	) {
		if (workbook.getNumberOfSheets() == 0) {
			return List.of();
		}

		org.apache.poi.ss.usermodel.Sheet excelSheet = workbook.getSheetAt(0);
		Row headerRow = excelSheet.getRow(0);

		if (headerRow == null) {
			return List.of();
		}

		DataFormatter formatter = new DataFormatter();
		Map<Integer, CastConfigColumnDef> columnByCellIndex = new LinkedHashMap<>();

		for (int cellIndex = 0; cellIndex < headerRow.getLastCellNum(); cellIndex++) {
			String label = formatter.formatCellValue(headerRow.getCell(cellIndex)).trim();
			CastConfigColumnDef column = sheet.getColumn(label);

			if (column != null && column.isEditable()) {
				columnByCellIndex.put(cellIndex, column);
			}
		}

		List<CastConfigSaveItemDto> result = new ArrayList<>();

		for (int rowIndex = 1; rowIndex <= excelSheet.getLastRowNum(); rowIndex++) {
			Row row = excelSheet.getRow(rowIndex);

			if (row == null) {
				continue;
			}

			for (Map.Entry<Integer, CastConfigColumnDef> entry : columnByCellIndex.entrySet()) {
				CastConfigSaveItemDto item = new CastConfigSaveItemDto();
				item.setFixAtrbGroupId(fixAtrbGroupId);
				item.setSheetNm(sheet.getSheetNm());
				// 엑셀 행 번호(0 기준)를 격자 행 번호(머리글 다음이 2)로 옮긴다
				item.setRowNo(rowIndex + 1);
				item.setColumn(entry.getValue().getColumn());
				item.setValue(formatter.formatCellValue(row.getCell(entry.getKey())).trim());

				result.add(item);
			}
		}

		return result;
	}

	private String toCellValue(CastConfigAtrbRawDto raw, String physicalColumn) {
		switch (physicalColumn) {
			case "PSG_ATRB_CD":
			case "FCLTY_SE_CD":
				return StringUtils.trimToEmpty(raw.getAtrbCdNm());
			case "PSG_DTL_SE_CD":
			case "FCLTY_DTL_CD":
				return StringUtils.trimToEmpty(raw.getDtlSeCdNm());
			case "INPT_VL":
				return StringUtils.trimToEmpty(raw.getInptVl());
			case "USER_DEF_1_VL":
				return StringUtils.trimToEmpty(raw.getUserDef1Vl());
			case "USER_DEF_2_VL":
				return StringUtils.trimToEmpty(raw.getUserDef2Vl());
			case "MIN_VL":
				return formatDecimal(raw.getMinVl());
			case "MAX_VL":
				return formatDecimal(raw.getMaxVl());
			case "DSTB_MAX_VL":
				return formatDecimal(raw.getDstbMaxVl());
			case "VL_TYPE":
				return StringUtils.trimToEmpty(raw.getVlType());
			case "SWTC_FNC_ID":
				return StringUtils.trimToEmpty(raw.getSwtcFncId());
			case "VRFC_FNC_ID":
				return StringUtils.trimToEmpty(raw.getVrfcFncId());
			default:
				return "";
		}
	}

	private String toRowKey(CastConfigAtrbRawDto row) {
		return StringUtils.trimToEmpty(row.getAtrbCd()) + "::" + StringUtils.trimToEmpty(row.getDtlSeCd());
	}

	private Map<String, CastConfigAtrbRawDto> toRowMap(List<CastConfigAtrbRawDto> rowList) {
		Map<String, CastConfigAtrbRawDto> result = new LinkedHashMap<>();

		for (CastConfigAtrbRawDto row : rowList) {
			result.put(toRowKey(row), row);
		}

		return result;
	}

	private CastConfigCategoryDto findPreProcessCategory() {
		return castConfigMapper
				.retrieveCategoryList(BASE_FIX_ATRB_GROUP_ID, PRE_PRCS_FIX_ATRB_GROUP_ID)
				.stream()
				.filter(category -> PRE_PRCS_FIX_ATRB_GROUP_ID.equals(category.getFixAtrbGroupId()))
				.findFirst()
				.orElse(null);
	}

	private CastConfigColumnDef findColumnByPhysical(CastConfigSheet sheet, String physicalColumn) {
		return sheet.getColumnList().stream()
				.filter(definition -> definition.isEditable())
				.filter(definition -> definition.getPhysicalColumn().equals(physicalColumn))
				.findFirst()
				.orElse(null);
	}

	// 되돌리기·복사가 다루는 것은 사용자가 고칠 수 있는 열뿐이다
	private List<String> getValueColumnList(CastConfigSheet sheet) {
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

	private String formatDecimal(BigDecimal value) {
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
