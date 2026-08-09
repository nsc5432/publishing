package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.DepHallTrendDto;
import aoms.pm.cast.service.CastDepHallService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 출국장.
 * {@code retrieveDepHall} 은 하단 타임라인을 옮길 때마다 hhmm 만 바꿔 재호출된다 (30분 단위).
 * {@code retrieveDepHallTrend} 는 하루치를 한 번에 내려주므로 터미널이 바뀔 때만 부른다.
 */
@RestController
@RequestMapping("/cast/dep-hall")
@RequiredArgsConstructor
public class CastDepHallController {
	private final CastDepHallService castDepHallService;

	@PostMapping(value = "/retrieveDepHall")
	public ResponseEntity<DepHallDto> retrieveDepHall(@RequestBody DepHallSearchDto searchDto) {
		return ResponseUtils.res(castDepHallService.retrieveDepHall(searchDto));
	}

	@PostMapping(value = "/retrieveDepHallTrend")
	public ResponseEntity<DepHallTrendDto> retrieveDepHallTrend(@RequestBody DepHallSearchDto searchDto) {
		return ResponseUtils.res(castDepHallService.retrieveDepHallTrend(searchDto));
	}
}
