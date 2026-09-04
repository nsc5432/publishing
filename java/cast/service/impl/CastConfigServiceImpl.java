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
import aoms.pm.cast.dto.CastConfigAplySetHstryDto;
import aoms.pm.cast.dto.CastConfigAplySetHstryListDto;
import aoms.pm.cast.dto.CastConfigAplySetRevertDto;
import aoms.pm.cast.dto.CastConfigAtrbRawDto;
import aoms.pm.cast.dto.CastConfigCategoryCloneDto;
import aoms.pm.cast.dto.CastConfigCategoryCloneResultDto;
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
import aoms.pm.cast.dto.CastConfigSetDatasetDto;
import aoms.pm.cast.dto.CastConfigSetDto;
import aoms.pm.cast.dto.CastConfigSetSaveDto;
import aoms.pm.cast.dto.CastConfigSetSaveItemDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.enums.CastConfigCatalogKind;
import aoms.pm.cast.enums.CastConfigColumnDef;
import aoms.pm.cast.enums.CastConfigColumnType;
import aoms.pm.cast.enums.CastConfigGroup;
import aoms.pm.cast.enums.CastConfigSheet;
import aoms.pm.cast.enums.CastConfigTerminalRule;
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

	@Override
	public CastConfigCategoryCloneResultDto cloneCategory(CastConfigCategoryCloneDto cloneDto) {
		CastConfigCategoryCloneResultDto result = new CastConfigCategoryCloneResultDto();
		SessionUtils.setUserContext(cloneDto, sessionService);

		if (StringUtils.isBlank(cloneDto.getLoginUserId())) {
			return (CastConfigCategoryCloneResultDto) result.error("로그인을 진행해주세요.");
		}

		String sourceId = StringUtils.trimToEmpty(cloneDto.getSrcFixAtrbGroupId());
		if (StringUtils.isBlank(sourceId)) {
			return (CastConfigCategoryCloneResultDto) result.error("원본 카테고리가 지정되지 않았습니다.");
		}

		if (StringUtils.isBlank(cloneDto.getAtrbGroupNm())) {
			return (CastConfigCategoryCloneResultDto) result.error("카테고리명을 입력해 주세요.");
		}

		if (castConfigMapper.retrieveCategoryForUpdate(BASE_FIX_ATRB_GROUP_ID) == null) {
			return (CastConfigCategoryCloneResultDto) result.error("기준정보를 찾지 못했습니다.");
		}

		if (PRE_PRCS_FIX_ATRB_GROUP_ID.equals(sourceId)) {
			PreProcessLock lock = lockPreProcessCategory();
			if (lock.isBusy()) {
				return (CastConfigCategoryCloneResultDto) result.error(PRE_PRCS_BUSY_MESSAGE);
			}
			if (lock.getCategory() == null) {
				return (CastConfigCategoryCloneResultDto) result.error("전처리 결과를 찾지 못했습니다.");
			}
		} else if (!BASE_FIX_ATRB_GROUP_ID.equals(sourceId)
				&& castConfigMapper.retrieveCategoryForUpdate(sourceId) == null) {
			return (CastConfigCategoryCloneResultDto) result.error("원본 카테고리를 찾지 못했습니다.");
		}

		String newCategoryId = castConfigMapper.retrieveAvailableCategoryId();
		if (StringUtils.isBlank(newCategoryId)) {
			return (CastConfigCategoryCloneResultDto) result.error("사용 가능한 카테고리 코드가 없습니다.");
		}

		castConfigMapper.insertClonedCategory(
				newCategoryId,
				cloneDto.getAtrbGroupNm().trim(),
				cloneDto.getLoginUserId(),
				cloneDto.getLoginIpAddr()
		);

		String copySourceId = PRE_PRCS_FIX_ATRB_GROUP_ID.equals(sourceId) ? BASE_FIX_ATRB_GROUP_ID : sourceId;
		for (CastConfigSheet sheet : CastConfigSheet.values()) {
			int inserted = castConfigMapper.insertFromGroup(
					sheet.getTableNm(),
					getValueColumnList(sheet),
					sheet.getGroupColumnNm(),
					copySourceId,
					newCategoryId,
					sheet.getKeyColumnNm(),
					sheet.getDtlColumnNm(),
					cloneDto.getLoginUserId(),
					cloneDto.getLoginIpAddr()
			);
			if (inserted == 0) {
				TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
				return (CastConfigCategoryCloneResultDto) result.error("원본 카테고리에 복제할 시트 데이터가 없습니다.");
			}
		}

		if (PRE_PRCS_FIX_ATRB_GROUP_ID.equals(sourceId)) {
			JsonResponse overlayError = overlayPreProcess(newCategoryId, cloneDto.getLoginUserId(), cloneDto.getLoginIpAddr());
			if (overlayError != null) {
				return (CastConfigCategoryCloneResultDto) result.error(overlayError.getErrorMessage());
			}
		}

		result.setFixAtrbGroupId(newCategoryId);
		return result;
	}

	@Override
	public JsonResponse saveCategorySet(CastConfigSetSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		if (StringUtils.isBlank(saveDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		String categoryId = StringUtils.trimToEmpty(saveDto.getFixAtrbGroupId());
		if (isReservedGroup(categoryId)) {
			return new JsonResponse().error("기준정보와 전처리 결과는 수정할 수 없습니다.");
		}

		if (castConfigMapper.retrieveCategoryForUpdate(categoryId) == null) {
			return new JsonResponse().error("카테고리를 찾지 못했습니다.");
		}

		if (saveDto.getItemList() == null || saveDto.getItemList().isEmpty()) {
			return new JsonResponse().error("저장할 변경 내용이 없습니다.");
		}

		Map<String, List<CastConfigSaveItemDto>> itemMap = new LinkedHashMap<>();
		Map<String, ConfigScope> scopeMap = new LinkedHashMap<>();

		for (CastConfigSetSaveItemDto item : saveDto.getItemList()) {
			CastConfigGroup group = CastConfigGroup.fromGroupId(item.getGroupId());
			CastConfigSheet sheet = CastConfigSheet.fromSheetNm(item.getSheetNm());
			if (item.getTmnlId() == null || group == null || sheet == null || !group.supports(sheet)) {
				return new JsonResponse().error("저장 범위를 확인해 주세요.");
			}

			String scopeKey = item.getTmnlId().name() + "::" + group.getGroupId() + "::" + sheet.name();
			CastConfigSaveItemDto legacyItem = new CastConfigSaveItemDto();
			legacyItem.setFixAtrbGroupId(categoryId);
			legacyItem.setSheetNm(item.getSheetNm());
			legacyItem.setRowNo(item.getRowNo());
			legacyItem.setColumn(item.getColumn());
			legacyItem.setValue(item.getValue());
			itemMap.computeIfAbsent(scopeKey, ignored -> new ArrayList<>()).add(legacyItem);
			scopeMap.putIfAbsent(scopeKey, new ConfigScope(group, sheet, item.getTmnlId(), item.getTmnlId()));
		}

		List<UpdateTarget> targets = new ArrayList<>();
		for (Map.Entry<String, List<CastConfigSaveItemDto>> entry : itemMap.entrySet()) {
			ConfigScope scope = scopeMap.get(entry.getKey());
			JsonResponse validationError = appendUpdateTargets(
					targets,
					scope.getGroup(),
					scope.getQueryTerminal(),
					entry.getValue()
			);
			if (validationError != null) {
				return validationError;
			}
		}

		Map<String, UpdateTarget> uniqueTargets = new LinkedHashMap<>();
		for (UpdateTarget target : targets) {
			UpdateTarget previous = uniqueTargets.putIfAbsent(target.key(), target);
			if (previous != null && !previous.getValue().equals(target.getValue())) {
				return new JsonResponse().error("같은 설정값이 서로 다르게 수정되었습니다.");
			}
		}

		for (UpdateTarget target : uniqueTargets.values()) {
			if (update(target, saveDto.getLoginUserId(), saveDto.getLoginIpAddr()) != 1) {
				return rollbackError("다른 사용자가 데이터를 변경했습니다. 다시 조회해 주세요.");
			}
		}

		return new JsonResponse();
	}

	@Override
	public CastConfigSetDto retrieveCategorySet(CastConfigSearchDto searchDto) {
		CastConfigSetDto result = new CastConfigSetDto();
		String categoryId = StringUtils.trimToEmpty(searchDto.getFixAtrbGroupId());

		if (StringUtils.isBlank(categoryId) || castConfigMapper.retrieveCategoryCnt(categoryId) == 0) {
			return (CastConfigSetDto) result.error("카테고리를 찾지 못했습니다.");
		}

		List<CastConfigSetDatasetDto> datasetList = new ArrayList<>();
		for (ConfigScope scope : getSetScopes()) {
			CastConfigDatasetDto dataset = toDataset(
					scope.getSheet(),
					scope.getGroup(),
					scope.getQueryTerminal(),
					categoryId
			);
			if (dataset.getRowList().isEmpty()) {
				continue;
			}

			CastConfigSetDatasetDto item = new CastConfigSetDatasetDto();
			item.setTmnlId(scope.getDisplayTerminal() == null ? "" : scope.getDisplayTerminal().getValue());
			item.setGroupId(scope.getGroup().getGroupId());
			item.setGroupNm(scope.getGroup().getGroupNm());
			item.setDataset(dataset);
			datasetList.add(item);
		}

		result.setFixAtrbGroupId(categoryId);
		result.setDatasetList(datasetList);
		return result;
	}

	@Override
	public JsonResponse applyCategorySet(CastConfigSearchDto searchDto) {
		SessionUtils.setUserContext(searchDto, sessionService);

		if (StringUtils.isBlank(searchDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		String sourceId = StringUtils.trimToEmpty(searchDto.getFixAtrbGroupId());
		if (StringUtils.isBlank(sourceId)) {
			return new JsonResponse().error("카테고리가 지정되지 않았습니다.");
		}
		if (BASE_FIX_ATRB_GROUP_ID.equals(sourceId)) {
			return new JsonResponse().error("기준정보는 운영 반영 대상이 아닙니다.");
		}
		if (castConfigMapper.retrieveCategoryForUpdate(BASE_FIX_ATRB_GROUP_ID) == null) {
			return new JsonResponse().error("기준정보를 찾지 못했습니다.");
		}

		if (PRE_PRCS_FIX_ATRB_GROUP_ID.equals(sourceId)) {
			PreProcessLock lock = lockPreProcessCategory();
			if (lock.isBusy()) {
				return new JsonResponse().error(PRE_PRCS_BUSY_MESSAGE);
			}
			if (lock.getCategory() == null) {
				return new JsonResponse().error("전처리 결과를 찾지 못했습니다.");
			}
		} else if (castConfigMapper.retrieveCategoryForUpdate(sourceId) == null) {
			return new JsonResponse().error("카테고리를 찾지 못했습니다.");
		}

		long aplySetSn = castConfigMapper.retrieveAplySetSn();
		CastConfigAplySetHstryDto setHstry = new CastConfigAplySetHstryDto();
		setHstry.setAplySetSn(aplySetSn);
		setHstry.setSrcFixAtrbGroupId(sourceId);
		setHstry.setTgtFixAtrbGroupId(BASE_FIX_ATRB_GROUP_ID);
		setHstry.setLoginUserId(searchDto.getLoginUserId());
		setHstry.setLoginIpAddr(searchDto.getLoginIpAddr());
		castConfigMapper.insertAplySetHstry(setHstry);

		boolean fromPreProcess = PRE_PRCS_FIX_ATRB_GROUP_ID.equals(sourceId);
		int totalRowCnt = 0;
		for (ConfigScope scope : getSetScopes()) {
			CastConfigSheet sheet = scope.getSheet();
			List<String> valueColumnList = fromPreProcess
					? sheet.getPrePrcsValueColumnList()
					: getValueColumnList(sheet);
			if (valueColumnList.isEmpty()) {
				continue;
			}

			List<CastConfigAtrbRawDto> baseList = retrieveRows(
					sheet,
					scope.getGroup(),
					scope.getQueryTerminal(),
					BASE_FIX_ATRB_GROUP_ID
			);
			Map<String, CastConfigAtrbRawDto> sourceMap = toRowMap(
					retrieveRows(sheet, scope.getGroup(), scope.getQueryTerminal(), sourceId)
			);
			List<CastConfigAtrbRawDto> targets = baseList.stream()
					.filter(row -> !fromPreProcess || YN_Y.equals(row.getPrePrcsYn()))
					.filter(row -> sourceMap.containsKey(toRowKey(row)))
					.collect(Collectors.toList());
			if (targets.isEmpty()) {
				continue;
			}

			long aplySn = castConfigMapper.retrieveAplyHstrySn();
			CastConfigAplyHstryDto hstry = new CastConfigAplyHstryDto();
			hstry.setAplySn(aplySn);
			hstry.setAplySetSn(aplySetSn);
			hstry.setSrcFixAtrbGroupId(sourceId);
			hstry.setTgtFixAtrbGroupId(BASE_FIX_ATRB_GROUP_ID);
			hstry.setTmnlId(scope.getDisplayTerminal() == null ? "" : scope.getDisplayTerminal().getValue());
			hstry.setGroupId(scope.getGroup().getGroupId());
			hstry.setTblNm(sheet.getTableNm());
			hstry.setSheetNm(sheet.getSheetNm());
			hstry.setAplyRowCnt(targets.size());
			hstry.setLoginUserId(searchDto.getLoginUserId());
			hstry.setLoginIpAddr(searchDto.getLoginIpAddr());
			castConfigMapper.insertAplyHstry(hstry);

			for (CastConfigAtrbRawDto row : targets) {
				castConfigMapper.insertAplyHstryDtl(
						aplySn,
						sheet.getTableNm(),
						valueColumnList,
						sheet.getGroupColumnNm(),
						sourceId,
						BASE_FIX_ATRB_GROUP_ID,
						row.getAtrbCd(),
						row.getDtlSeCd(),
						sheet.getKeyColumnNm(),
						sheet.getDtlColumnNm()
				);

				int updated = castConfigMapper.copyFromGroup(
						sheet.getTableNm(),
						valueColumnList,
						sheet.getGroupColumnNm(),
						sourceId,
						BASE_FIX_ATRB_GROUP_ID,
						row.getAtrbCd(),
						row.getDtlSeCd(),
						sheet.getKeyColumnNm(),
						sheet.getDtlColumnNm(),
						searchDto.getLoginUserId(),
						searchDto.getLoginIpAddr()
				);
				if (updated != 1) {
					return rollbackError("카테고리와 일치하는 기준정보 행을 찾지 못했습니다.");
				}
			}

			totalRowCnt += targets.size();
		}

		if (totalRowCnt == 0) {
			return rollbackError("반영할 행이 없습니다.");
		}

		if (castConfigMapper.updateAplySetRowCnt(aplySetSn, totalRowCnt) != 1) {
			return rollbackError("반영 이력을 갱신하지 못했습니다.");
		}
		return new JsonResponse();
	}

	@Override
	public CastConfigAplySetHstryListDto retrieveApplySetHistory() {
		CastConfigAplySetHstryListDto result = new CastConfigAplySetHstryListDto();
		List<CastConfigAplySetHstryDto> hstryList = castConfigMapper.retrieveAplySetHstryList();
		for (CastConfigAplySetHstryDto hstry : hstryList) {
			List<CastConfigAplyHstryDto> detailList = castConfigMapper.retrieveAplyHstryListBySet(hstry.getAplySetSn());
			for (CastConfigAplyHstryDto detail : detailList) {
				detail.setTmnlId(StringUtils.trimToEmpty(detail.getTmnlId()));
				detail.setGroupId(StringUtils.trimToEmpty(detail.getGroupId()));
			}
			hstry.setDetailList(detailList);
		}
		result.setTotalCnt(hstryList.size());
		result.setHstryList(hstryList);
		return result;
	}

	@Override
	public JsonResponse revertApplySet(CastConfigAplySetRevertDto revertDto) {
		SessionUtils.setUserContext(revertDto, sessionService);

		if (StringUtils.isBlank(revertDto.getLoginUserId())) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}
		if (castConfigMapper.retrieveCategoryForUpdate(BASE_FIX_ATRB_GROUP_ID) == null) {
			return new JsonResponse().error("기준정보를 찾지 못했습니다.");
		}

		CastConfigAplySetHstryDto setHstry = castConfigMapper.retrieveAplySetHstryForUpdate(revertDto.getAplySetSn());
		if (setHstry == null) {
			return new JsonResponse().error("반영 세트를 찾지 못했습니다.");
		}
		if (YN_Y.equals(setHstry.getCnclYn())) {
			return new JsonResponse().error("이미 되돌린 반영 세트입니다.");
		}
		if (castConfigMapper.updateAplySetHstryCancel(revertDto.getAplySetSn(), revertDto.getLoginUserId()) != 1) {
			return new JsonResponse().error("최신 반영 세트부터 되돌려 주세요.");
		}

		for (CastConfigAplyHstryDto hstry : castConfigMapper.retrieveAplyHstryListBySet(revertDto.getAplySetSn())) {
			CastConfigSheet sheet = CastConfigSheet.fromSheetNm(hstry.getSheetNm());
			if (sheet == null) {
				return rollbackError("등록되지 않은 시트가 이력에 포함되어 있습니다.");
			}

			for (CastConfigAplyHstryDtlDto detail : castConfigMapper.retrieveAplyHstryDtlList(hstry.getAplySn())) {
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
		}

		castConfigMapper.updateAplyHstryCancelBySet(revertDto.getAplySetSn(), revertDto.getLoginUserId());
		return new JsonResponse();
	}

	private JsonResponse overlayPreProcess(String targetCategoryId, String loginUserId, String loginIpAddr) {
		for (ConfigScope scope : getSetScopes()) {
			CastConfigSheet sheet = scope.getSheet();
			List<String> valueColumnList = sheet.getPrePrcsValueColumnList();
			if (valueColumnList.isEmpty()) {
				continue;
			}

			Map<String, CastConfigAtrbRawDto> sourceMap = toRowMap(
					retrieveRows(sheet, scope.getGroup(), scope.getQueryTerminal(), PRE_PRCS_FIX_ATRB_GROUP_ID)
			);
			for (CastConfigAtrbRawDto row : retrieveRows(sheet, scope.getGroup(), scope.getQueryTerminal(), targetCategoryId)) {
				if (!YN_Y.equals(row.getPrePrcsYn()) || !sourceMap.containsKey(toRowKey(row))) {
					continue;
				}

				int updated = castConfigMapper.copyFromGroup(
						sheet.getTableNm(),
						valueColumnList,
						sheet.getGroupColumnNm(),
						PRE_PRCS_FIX_ATRB_GROUP_ID,
						targetCategoryId,
						row.getAtrbCd(),
						row.getDtlSeCd(),
						sheet.getKeyColumnNm(),
						sheet.getDtlColumnNm(),
						loginUserId,
						loginIpAddr
				);
				if (updated != 1) {
					return rollbackError("전처리 결과를 신규 카테고리에 복사하지 못했습니다.");
				}
			}
		}

		return null;
	}

	private List<ConfigScope> getSetScopes() {
		List<ConfigScope> scopes = new ArrayList<>();
		for (CastConfigGroup group : CastConfigGroup.values()) {
			for (CastConfigSheet sheet : group.getRootCdMap().keySet()) {
				if (sheet.getTerminalRule() == CastConfigTerminalRule.PSG_PARENT) {
					scopes.add(new ConfigScope(group, sheet, TerminalKind.T1, TerminalKind.T1));
					scopes.add(new ConfigScope(group, sheet, TerminalKind.T2, TerminalKind.T2));
				} else {
					scopes.add(new ConfigScope(group, sheet, TerminalKind.T1, null));
				}
			}
		}
		return scopes;
	}

	private CastConfigDatasetDto toDataset(
			CastConfigSheet sheet,
			CastConfigGroup group,
			TerminalKind terminal,
			String categoryId
	) {
		CastConfigDatasetDto dataset = new CastConfigDatasetDto();
		List<CastConfigAtrbRawDto> rawList = retrieveRows(sheet, group, terminal, categoryId);
		dataset.setSheetNm(sheet.getSheetNm());
		dataset.setDimension("");
		dataset.setColumnList(toColumnList(sheet));
		dataset.setRowList(toRowList(sheet, rawList, isReservedGroup(categoryId)));
		dataset.setShapeColumn(sheet.getShapeColumn());
		dataset.setValidation(sheet.getValidation());
		return dataset;
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
	private static class ConfigScope {
		private final CastConfigGroup group;
		private final CastConfigSheet sheet;
		private final TerminalKind queryTerminal;
		private final TerminalKind displayTerminal;

		ConfigScope(
				CastConfigGroup group,
				CastConfigSheet sheet,
				TerminalKind queryTerminal,
				TerminalKind displayTerminal
		) {
			this.group = group;
			this.sheet = sheet;
			this.queryTerminal = queryTerminal;
			this.displayTerminal = displayTerminal;
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

		String key() {
			return sheet.getTableNm()
					+ "::" + fixAtrbGroupId
					+ "::" + toKeyPart(row.getAtrbCd())
					+ "::" + toKeyPart(row.getDtlSeCd())
					+ "::" + column.getPhysicalColumn();
		}

		private String toKeyPart(String value) {
			return value == null ? "" : value.trim();
		}
	}
}
