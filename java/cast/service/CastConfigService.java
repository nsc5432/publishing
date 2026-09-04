package aoms.pm.cast.service;

import aoms.pm.cast.dto.CastConfigAplyHstryListDto;
import aoms.pm.cast.dto.CastConfigAplySetHstryListDto;
import aoms.pm.cast.dto.CastConfigAplySetRevertDto;
import aoms.pm.cast.dto.CastConfigCategoryCloneDto;
import aoms.pm.cast.dto.CastConfigCategoryCloneResultDto;
import aoms.pm.cast.dto.CastConfigCategoryListDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;
import aoms.pm.cast.dto.CastConfigDatasetDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigOperApplyDto;
import aoms.pm.cast.dto.CastConfigPreProcessRevertDto;
import aoms.pm.cast.dto.CastConfigSaveDto;
import aoms.pm.cast.dto.CastConfigSetDto;
import aoms.pm.cast.dto.CastConfigSetSaveDto;
import aoms.pm.cast.dto.CastConfigSearchDto;
import aoms.pm.cast.dto.JsonResponse;

public interface CastConfigService {
	CastConfigGroupListDto retrieveGroupList(CastConfigSearchDto searchDto);

	CastConfigDatasetDto retrieveDataset(CastConfigSearchDto searchDto);

	JsonResponse saveDataset(CastConfigSaveDto saveDto);

	CastConfigCategoryListDto retrieveCategoryList(CastConfigSearchDto searchDto);

	JsonResponse saveCategory(CastConfigCategorySaveDto saveDto);

	JsonResponse applyOperation(CastConfigOperApplyDto applyDto);

	CastConfigAplyHstryListDto retrievePreProcessHistory(CastConfigSearchDto searchDto);

	JsonResponse revertPreProcess(CastConfigPreProcessRevertDto revertDto);

	CastConfigCategoryCloneResultDto cloneCategory(CastConfigCategoryCloneDto cloneDto);

	JsonResponse saveCategorySet(CastConfigSetSaveDto saveDto);

	CastConfigSetDto retrieveCategorySet(CastConfigSearchDto searchDto);

	JsonResponse applyCategorySet(CastConfigSearchDto searchDto);

	CastConfigAplySetHstryListDto retrieveApplySetHistory();

	JsonResponse revertApplySet(CastConfigAplySetRevertDto revertDto);
}
