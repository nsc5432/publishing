package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.SmltMapDto;
import aoms.pm.cast.service.CastMapService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 맵형태보기.
 * {@code retrieveSmltMap} 은 하루치(30분 49칸)를 한 번에 내려준다. 화면은 하단 타임라인을
 * 옮길 때도, 마커 상세 팝업을 열 때도 다시 부르지 않는다 — 터미널이 바뀔 때만 부른다.
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
}
