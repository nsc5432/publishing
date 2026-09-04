package aoms.pm.cast.service;

import aoms.pm.cast.dto.CastConfigAplyHstryListDto;
import aoms.pm.cast.dto.CastConfigCategoryListDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;
import aoms.pm.cast.dto.CastConfigDatasetDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigOperApplyDto;
import aoms.pm.cast.dto.CastConfigPreProcessRevertDto;
import aoms.pm.cast.dto.CastConfigSaveDto;
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
}
