package aoms.pm.cast.service;

import aoms.pm.cast.dto.CastConfigAplySetHstryListDto;
import aoms.pm.cast.dto.CastConfigAplySetRevertDto;
import aoms.pm.cast.dto.CastConfigCategoryCloneDto;
import aoms.pm.cast.dto.CastConfigCategoryCloneResultDto;
import aoms.pm.cast.dto.CastConfigCategoryListDto;
import aoms.pm.cast.dto.CastConfigDatasetDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigSetDto;
import aoms.pm.cast.dto.CastConfigSetSaveDto;
import aoms.pm.cast.dto.CastConfigSearchDto;
import aoms.pm.cast.dto.JsonResponse;

public interface CastConfigService {
	CastConfigGroupListDto retrieveGroupList(CastConfigSearchDto searchDto);

	CastConfigDatasetDto retrieveDataset(CastConfigSearchDto searchDto);

	CastConfigCategoryListDto retrieveCategoryList(CastConfigSearchDto searchDto);

	CastConfigCategoryCloneResultDto cloneCategory(CastConfigCategoryCloneDto cloneDto);

	JsonResponse saveCategorySet(CastConfigSetSaveDto saveDto);

	CastConfigSetDto retrieveCategorySet(CastConfigSearchDto searchDto);

	JsonResponse applyCategorySet(CastConfigSearchDto searchDto);

	CastConfigAplySetHstryListDto retrieveApplySetHistory();

	JsonResponse revertApplySet(CastConfigAplySetRevertDto revertDto);
}
