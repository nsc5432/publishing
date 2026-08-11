package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.FcltMapListDto;
import aoms.pm.cast.dto.FcltMapSaveDto;
import aoms.pm.cast.dto.FcltMapSearchDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.service.CastFcltService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 시설물 매핑.
 * 여객시설과 CAST 시뮬레이션 시설의 짝을 확인하고, 시뮬레이션시설명만 고쳐 저장한다.
 */
@RestController
@RequestMapping("/cast/fclt")
@RequiredArgsConstructor
public class CastFcltController {
	private final CastFcltService castFcltService;

	@PostMapping(value = "/retrieveFcltMapList")
	public ResponseEntity<FcltMapListDto> retrieveFcltMapList(@RequestBody FcltMapSearchDto searchDto) {
		return ResponseUtils.res(castFcltService.retrieveFcltMapList(searchDto));
	}

	@PostMapping(value = "/saveFcltMapList")
	public ResponseEntity<JsonResponse> saveFcltMapList(@RequestBody FcltMapSaveDto saveDto) {
		return ResponseUtils.res(castFcltService.saveFcltMapList(saveDto));
	}
}
