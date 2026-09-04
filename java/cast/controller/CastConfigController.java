package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

	@PostMapping(value = "/applyOperation")
	public ResponseEntity<JsonResponse> applyOperation(@RequestBody CastConfigOperApplyDto applyDto) {
		return ResponseUtils.res(castConfigService.applyOperation(applyDto));
	}

	@PostMapping(value = "/retrievePreProcessHistory")
	public ResponseEntity<CastConfigAplyHstryListDto> retrievePreProcessHistory(@RequestBody CastConfigSearchDto searchDto) {
		return ResponseUtils.res(castConfigService.retrievePreProcessHistory(searchDto));
	}

	@PostMapping(value = "/revertPreProcess")
	public ResponseEntity<JsonResponse> revertPreProcess(@RequestBody CastConfigPreProcessRevertDto revertDto) {
		return ResponseUtils.res(castConfigService.revertPreProcess(revertDto));
	}

	@PostMapping(value = "/cloneCategory")
	public ResponseEntity<CastConfigCategoryCloneResultDto> cloneCategory(@RequestBody CastConfigCategoryCloneDto cloneDto) {
		return ResponseUtils.res(castConfigService.cloneCategory(cloneDto));
	}

	@PostMapping(value = "/saveCategorySet")
	public ResponseEntity<JsonResponse> saveCategorySet(@RequestBody CastConfigSetSaveDto saveDto) {
		return ResponseUtils.res(castConfigService.saveCategorySet(saveDto));
	}

	@PostMapping(value = "/retrieveCategorySet")
	public ResponseEntity<CastConfigSetDto> retrieveCategorySet(@RequestBody CastConfigSearchDto searchDto) {
		return ResponseUtils.res(castConfigService.retrieveCategorySet(searchDto));
	}

	@PostMapping(value = "/applyCategorySet")
	public ResponseEntity<JsonResponse> applyCategorySet(@RequestBody CastConfigSearchDto searchDto) {
		return ResponseUtils.res(castConfigService.applyCategorySet(searchDto));
	}

	@PostMapping(value = "/retrieveApplySetHistory")
	public ResponseEntity<CastConfigAplySetHstryListDto> retrieveApplySetHistory() {
		return ResponseUtils.res(castConfigService.retrieveApplySetHistory());
	}

	@PostMapping(value = "/revertApplySet")
	public ResponseEntity<JsonResponse> revertApplySet(@RequestBody CastConfigAplySetRevertDto revertDto) {
		return ResponseUtils.res(castConfigService.revertApplySet(revertDto));
	}
}
