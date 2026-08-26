package aoms.pm.cast.service;

import org.springframework.web.multipart.MultipartFile;

import aoms.pm.cast.dto.CastConfigCategoryListDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;
import aoms.pm.cast.dto.CastConfigDatasetDto;
import aoms.pm.cast.dto.CastConfigDefaultApplyDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigSaveDto;
import aoms.pm.cast.dto.CastConfigSearchDto;
import aoms.pm.cast.dto.JsonResponse;

public interface CastConfigService {
	CastConfigGroupListDto retrieveGroupList(CastConfigSearchDto searchDto);

	CastConfigDatasetDto retrieveDataset(CastConfigSearchDto searchDto);

	JsonResponse saveDataset(CastConfigSaveDto saveDto);

	CastConfigCategoryListDto retrieveCategoryList(CastConfigSearchDto searchDto);

	JsonResponse saveCategory(CastConfigCategorySaveDto saveDto);

	JsonResponse applyDefaultAttribute(CastConfigDefaultApplyDto applyDto);

	JsonResponse uploadExcel(
			String tmnlId,
			String groupId,
			String fixAtrbGroupId,
			String sheetNm,
			MultipartFile file
	);
}
