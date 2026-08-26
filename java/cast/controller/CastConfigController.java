package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import aoms.pm.cast.dto.CastConfigCategoryListDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;
import aoms.pm.cast.dto.CastConfigDatasetDto;
import aoms.pm.cast.dto.CastConfigDefaultApplyDto;
import aoms.pm.cast.dto.CastConfigGroupListDto;
import aoms.pm.cast.dto.CastConfigSaveDto;
import aoms.pm.cast.dto.CastConfigSearchDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.service.CastConfigService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/cast-config")
@RequiredArgsConstructor
public class CastConfigController {
	private final CastConfigService castConfigService;

	@PostMapping(value = "/retrieveGroupList")
	public ResponseEntity<CastConfigGroupListDto> retrieveGroupList(@RequestBody CastConfigSearchDto searchDto) {
		return ResponseUtils.res(castConfigService.retrieveGroupList(searchDto));
	}

	@PostMapping(value = "/retrieveDataset")
	public ResponseEntity<CastConfigDatasetDto> retrieveDataset(@RequestBody CastConfigSearchDto searchDto) {
		return ResponseUtils.res(castConfigService.retrieveDataset(searchDto));
	}

	@PostMapping(value = "/saveDataset")
	public ResponseEntity<JsonResponse> saveDataset(@RequestBody CastConfigSaveDto saveDto) {
		return ResponseUtils.res(castConfigService.saveDataset(saveDto));
	}

	@PostMapping(value = "/retrieveCategoryList")
	public ResponseEntity<CastConfigCategoryListDto> retrieveCategoryList(@RequestBody CastConfigSearchDto searchDto) {
		return ResponseUtils.res(castConfigService.retrieveCategoryList(searchDto));
	}

	@PostMapping(value = "/saveCategory")
	public ResponseEntity<JsonResponse> saveCategory(@RequestBody CastConfigCategorySaveDto saveDto) {
		return ResponseUtils.res(castConfigService.saveCategory(saveDto));
	}

	@PostMapping(value = "/applyDefaultAttribute")
	public ResponseEntity<JsonResponse> applyDefaultAttribute(@RequestBody CastConfigDefaultApplyDto applyDto) {
		return ResponseUtils.res(castConfigService.applyDefaultAttribute(applyDto));
	}

	@PostMapping(value = "/uploadExcel")
	public ResponseEntity<JsonResponse> uploadExcel(
			@RequestPart("tmnlId") String tmnlId,
			@RequestPart("groupId") String groupId,
			@RequestPart("fixAtrbGroupId") String fixAtrbGroupId,
			@RequestPart("sheetNm") String sheetNm,
			@RequestPart("file") MultipartFile file
	) {
		return ResponseUtils.res(castConfigService.uploadExcel(tmnlId, groupId, fixAtrbGroupId, sheetNm, file));
	}
}
