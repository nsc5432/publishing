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
 * 일일 시뮬레이션 결과 조회 — 체크인카운터 (셀프체크인/백드롭 포함).
 * {@code retrieveChknCounter} 는 하루치(30분 49칸 + 시간대별 자원 24칸)를 한 번에 내려준다.
 * 차트 · 표 두 보기와 하단 타임라인이 이 한 건을 나눠 쓰므로 터미널이 바뀔 때만 부른다.
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
