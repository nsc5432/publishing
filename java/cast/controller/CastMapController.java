package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.MapChknDetailDto;
import aoms.pm.cast.dto.MapDepDetailDto;
import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.SmltMapDto;
import aoms.pm.cast.service.CastMapService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 맵형태보기.
 * {@code retrieveSmltMap} 은 하단 타임라인을 옮길 때마다 hhmm 만 바꿔 재호출된다 (30분 단위).
 */
@RestController
@RequestMapping("/cast/map")
@RequiredArgsConstructor
public class CastMapController {
	private final CastMapService castMapService;

	@PostMapping(value = "/retrieveSmltMap")
	public ResponseEntity<SmltMapDto> retrieveSmltMap(@RequestBody MapSearchDto searchDto) {
		return ResponseUtils.res(castMapService.retrieveSmltMap(searchDto));
	}

	@PostMapping(value = "/retrieveSmltMapChknDetail")
	public ResponseEntity<MapChknDetailDto> retrieveSmltMapChknDetail(@RequestBody MapSearchDto searchDto) {
		return ResponseUtils.res(castMapService.retrieveSmltMapChknDetail(searchDto));
	}

	@PostMapping(value = "/retrieveSmltMapDepDetail")
	public ResponseEntity<MapDepDetailDto> retrieveSmltMapDepDetail(@RequestBody MapSearchDto searchDto) {
		return ResponseUtils.res(castMapService.retrieveSmltMapDepDetail(searchDto));
	}
}
