package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.ChknCounterDto;
import aoms.pm.cast.dto.ChknCounterSearchDto;
import aoms.pm.cast.service.CastChknCounterService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 체크인카운터
 */
@RestController
@RequestMapping("/cast/chkn-counter")
@RequiredArgsConstructor
public class CastChknCounterController {
	private final CastChknCounterService castChknCounterService;

	@PostMapping(value = "/retrieveChknCounter")
	public ResponseEntity<ChknCounterDto> retrieveChknCounter(@RequestBody ChknCounterSearchDto searchDto) {
		return ResponseUtils.res(castChknCounterService.retrieveChknCounter(searchDto));
	}
}
