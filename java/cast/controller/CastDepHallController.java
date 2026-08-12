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
 * 일일 시뮬레이션 결과 조회 — 출국장.
 * {@code retrieveDepHall} 은 하루치(30분 41칸)를 한 번에 내려준다. 맵 · 표 · 차트 세 보기와
 * 하단 타임라인이 이 한 건을 나눠 쓰므로 터미널이 바뀔 때만 부른다.
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
