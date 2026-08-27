package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.service.CastDepHallService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 출국장
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
}
