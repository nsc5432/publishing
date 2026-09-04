package aoms.pm.cast.service.impl;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.CannotAcquireLockException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;

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
import aoms.pm.cast.dto.CastConfigGridCellDto;
import aoms.pm.cast.dto.CastConfigGridRowDto;
import aoms.pm.cast.dto.CastConfigGroupDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigOperApplyDto;
import aoms.pm.cast.dto.CastConfigPreProcessRevertDto;
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
	private static final String PRE_PRCS_FIX_ATRB_GROUP_ID = "999";
	private static final String INPT_VL_COLUMN = "INPT_VL";
	private static final String PRE_PRCS_BUSY_MESSAGE =
			"전처리 결과가 갱신 중입니다. 잠시 후 다시 시도해 주세요.";
	private static final String VL_TYPE_INTEGER = "Integer";
	private static final String VL_TYPE_FLOAT = "Float";
	private static final String YN_Y = "Y";
	private static final String YN_N = "N";
	private static final String FRST_REG_DT_PATTERN = "\\d{14}";
	private static final Set<String> NUMBER_COLUMN_SET =
			Set.of("MIN_VL", "MAX_VL", "DSTB_MAX_VL", "CKNCT_RT", "KOS_RT", "MOB_RT", "SRVC_HR");

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
		boolean isReadOnlyGroup = isReservedGroup(searchDto.getFixAtrbGroupId());

		result.setSheetNm(sheet.getSheetNm());
		result.setDimension("");
		result.setColumnList(toColumnList(sheet));
		result.setRowList(toRowList(sheet, rawList, isReadOnlyGroup));
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
	public JsonResponse applyOperation(CastConfigOperApplyDto applyDto) {
		SessionUtils.setUserContext(applyDto, sessionService);

		if (StringUtils.isBlank(applyDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		CastConfigGroup group = CastConfigGroup.fromGroupId(applyDto.getGroupId());

		if (group == null) {
			return new JsonResponse().error("시설그룹을 찾지 못했습니다.");
		}

		if (applyDto.getTmnlId() == null) {
			return new JsonResponse().error("터미널이 지정되지 않았습니다.");
		}

		String srcFixAtrbGroupId = StringUtils.trimToEmpty(applyDto.getFixAtrbGroupId());

		if (StringUtils.isBlank(srcFixAtrbGroupId)) {
			return new JsonResponse().error("카테고리가 지정되지 않았습니다.");
		}

		if (BASE_FIX_ATRB_GROUP_ID.equals(srcFixAtrbGroupId)) {
			return new JsonResponse().error("기준정보는 운영 반영 대상이 아닙니다.");
		}

		boolean fromPreProcess = PRE_PRCS_FIX_ATRB_GROUP_ID.equals(srcFixAtrbGroupId);

		if (fromPreProcess && lockPreProcessCategory().isBusy()) {
			return new JsonResponse().error(PRE_PRCS_BUSY_MESSAGE);
		}

		int totalRowCnt = 0;

		for (CastConfigSheet sheet : group.getRootCdMap().keySet()) {
			// 999 는 파이프라인이 전처리 산출 컬럼만 채운다. 나머지까지 복사하면 NULL 이 기준정보를 비운다.
			List<String> valueColumnList = fromPreProcess
					? sheet.getPrePrcsValueColumnList()
					: getValueColumnList(sheet);

			if (valueColumnList.isEmpty()) {
				continue;
			}

			List<CastConfigAtrbRawDto> baseList =
					retrieveRows(sheet, group, applyDto.getTmnlId(), BASE_FIX_ATRB_GROUP_ID);
			Map<String, CastConfigAtrbRawDto> srcMap = toRowMap(
					retrieveRows(sheet, group, applyDto.getTmnlId(), srcFixAtrbGroupId)
			);
			List<CastConfigAtrbRawDto> targetList = new ArrayList<>();

			// copyFromGroup 은 UPDATE 만 한다. 기준정보에 없는 행은 조용히 빠지므로 미리 걱러 낸다.
			for (CastConfigAtrbRawDto base : baseList) {
				if (fromPreProcess && !YN_Y.equals(base.getPrePrcsYn())) {
					continue;
				}

				if (srcMap.containsKey(toRowKey(base))) {
					targetList.add(base);
				}
			}

			if (targetList.isEmpty()) {
				continue;
			}

			long aplySn = castConfigMapper.retrieveAplyHstrySn();
			CastConfigAplyHstryDto hstry = new CastConfigAplyHstryDto();
			hstry.setAplySn(aplySn);
			hstry.setSrcFixAtrbGroupId(srcFixAtrbGroupId);
			hstry.setTgtFixAtrbGroupId(BASE_FIX_ATRB_GROUP_ID);
			hstry.setTmnlId(applyDto.getTmnlId().getValue());
			hstry.setTblNm(sheet.getTableNm());
			hstry.setSheetNm(sheet.getSheetNm());
			hstry.setAplyRowCnt(targetList.size());
			hstry.setLoginUserId(applyDto.getLoginUserId());
			hstry.setLoginIpAddr(applyDto.getLoginIpAddr());
			castConfigMapper.insertAplyHstry(hstry);

			// 스냅샷을 먼저 남긴다. 복사 뒤에 찍으면 되돌릴 값이 이미 덮여 있다.
			for (CastConfigAtrbRawDto row : targetList) {
				castConfigMapper.insertAplyHstryDtl(
						aplySn,
						sheet.getTableNm(),
						valueColumnList,
						sheet.getGroupColumnNm(),
						srcFixAtrbGroupId,
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
						sheet.getGroupColumnNm(),
						srcFixAtrbGroupId,
						BASE_FIX_ATRB_GROUP_ID,
						row.getAtrbCd(),
						row.getDtlSeCd(),
						sheet.getKeyColumnNm(),
						sheet.getDtlColumnNm(),
						applyDto.getLoginUserId(),
						applyDto.getLoginIpAddr()
				);

				if (updated != 1) {
					return rollbackError("카테고리와 일치하는 기준정보 행을 찾지 못했습니다.");
				}
			}

			totalRowCnt += targetList.size();
		}

		if (totalRowCnt == 0) {
			return rollbackError("반영할 행이 없습니다.");
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

		PreProcessLock lock = lockPreProcessCategory();

		if (lock.isBusy()) {
			return new JsonResponse().error(PRE_PRCS_BUSY_MESSAGE);
		}

		if (lock.getCategory() == null) {
			return new JsonResponse().error("전처리 결과를 찾지 못했습니다.");
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

		if (castConfigMapper.updateAplyHstryCancel(revertDto.getAplySn(), revertDto.getLoginUserId()) != 1) {
			return new JsonResponse().error("최신 반영부터 되돌려 주세요.");
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
					sheet.getGroupColumnNm(),
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

		if (isReservedGroup(saveDto.getFixAtrbGroupId())) {
			return new JsonResponse().error("예약된 카테고리 코드입니다.");
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
					sheet.getGroupColumnNm(),
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

		if (isReservedGroup(firstItem.getFixAtrbGroupId())) {
			return new JsonResponse().error("기준정보와 전처리 결과는 수정할 수 없습니다.");
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
				sheet.getGroupColumnNm(),
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
		if (sheet.getCatalogKind() == CastConfigCatalogKind.CKNCT_TYPE) {
			return castConfigMapper.retrieveCknctTypeAtrbList(fixAtrbGroupId);
		}

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

	private List<CastConfigGridRowDto> toRowList(
			CastConfigSheet sheet,
			List<CastConfigAtrbRawDto> rawList,
			boolean isReadOnlyGroup
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
				cell.setEditableYn(!isReadOnlyGroup && definition.isEditable() ? YN_Y : YN_N);

				cellList.add(cell);
			}

			CastConfigGridRowDto row = new CastConfigGridRowDto();
			row.setRowNo(index + FIRST_DATA_ROW_NO);
			row.setCellList(cellList);

			result.add(row);
		}

		return result;
	}

	private String toCellValue(CastConfigAtrbRawDto raw, String physicalColumn) {
		switch (physicalColumn) {
			case "PSG_ATRB_CD":
			case "FCLTY_SE_CD":
			case "ALN_CD":
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
			case "CKNCT_RT":
				return StringUtils.trimToEmpty(raw.getCknctRt());
			case "KOS_RT":
				return StringUtils.trimToEmpty(raw.getKosRt());
			case "MOB_RT":
				return StringUtils.trimToEmpty(raw.getMobRt());
			case "SRVC_HR":
				return StringUtils.trimToEmpty(raw.getSrvcHr());
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

	// 주간 파이프라인이 999 를 갈아 끼우는 동안 이 행을 잡고 있다. 무한 대기하면 요청
	// 스레드가 그대로 묶여 FOR UPDATE WAIT 3 으로 끊는다.
	// 대기 초과 예외 타입은 Tibero 드라이버 확정 전이다 — 안 걸리면 DataAccessException 으로 넓힌다.
	private PreProcessLock lockPreProcessCategory() {
		try {
			return new PreProcessLock(
					castConfigMapper.retrieveCategoryForUpdate(PRE_PRCS_FIX_ATRB_GROUP_ID),
					false
			);
		} catch (CannotAcquireLockException e) {
			// 락 획득 전이라 쓴 것이 없다. 롤백 표시 없이 안내로 돌려보낸다
			return new PreProcessLock(null, true);
		}
	}

	private boolean isReservedGroup(String fixAtrbGroupId) {
		return BASE_FIX_ATRB_GROUP_ID.equals(fixAtrbGroupId)
				|| PRE_PRCS_FIX_ATRB_GROUP_ID.equals(fixAtrbGroupId);
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
	private static class PreProcessLock {
		private final CastConfigCategoryDto category;
		private final boolean busy;

		PreProcessLock(CastConfigCategoryDto category, boolean busy) {
			this.category = category;
			this.busy = busy;
		}
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
