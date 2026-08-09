package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.MntrSearchDto;
import aoms.pm.cast.dto.SmltExecDetailDto;
import aoms.pm.cast.dto.SmltExecListDto;
import aoms.pm.cast.dto.SmltExecSmryDto;
import aoms.pm.cast.service.CastMntrService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 시뮬레이션 모니터링.
 * 조회 기간(bgnDt ~ endDt)은 화면의 시작/종료 일시를 합친 yyyyMMddHHmm 이다.
 */
@RestController
@RequestMapping("/cast/mntr")
@RequiredArgsConstructor
public class CastMntrController {
	private final CastMntrService castMntrService;

	@PostMapping(value = "/retrieveSmltExecSmry")
	public ResponseEntity<SmltExecSmryDto> retrieveSmltExecSmry(@RequestBody MntrSearchDto searchDto) {
		return ResponseUtils.res(castMntrService.retrieveSmltExecSmry(searchDto));
	}

	@PostMapping(value = "/retrieveSmltExecList")
	public ResponseEntity<SmltExecListDto> retrieveSmltExecList(@RequestBody MntrSearchDto searchDto) {
		return ResponseUtils.res(castMntrService.retrieveSmltExecList(searchDto));
	}

	@PostMapping(value = "/retrieveSmltExecDetail")
	public ResponseEntity<SmltExecDetailDto> retrieveSmltExecDetail(@RequestBody MntrSearchDto searchDto) {
		return ResponseUtils.res(castMntrService.retrieveSmltExecDetail(searchDto));
	}
}
