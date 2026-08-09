package aoms.pm.cast.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
import aoms.pm.cast.dto.DsbdRsltDto;
import aoms.pm.cast.dto.DsbdSearchDto;
import aoms.pm.cast.dto.TmnlSmryDto;
import aoms.pm.cast.service.CastDsbdService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 요약보기(대시보드).
 * 화면은 {@code retrieveDailySmltBaseInfo} 로 smltId 를 잡은 뒤 나머지 4개를 부른다.
 */
@RestController
@RequestMapping("/cast/smry")
@RequiredArgsConstructor
public class CastSmryController {
	private final CastDsbdService castDsbdService;

	@PostMapping(value = "/retrieveDailySmltBaseInfo")
	public ResponseEntity<DsbdBaseInfoDto> retrieveDailySmltBaseInfo(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castDsbdService.retrieveDailySmltBaseInfo(searchDto));
	}

	@PostMapping(value = "/retrieveDailySmltHeader")
	public ResponseEntity<DsbdHeaderDto> retrieveDailySmltHeader(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castDsbdService.retrieveDailySmltHeader(searchDto));
	}

	@PostMapping(value = "/retrieveDailySmltTmnlSmry")
	public ResponseEntity<TmnlSmryDto> retrieveDailySmltTmnlSmry(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castDsbdService.retrieveDailySmltTmnlSmry(searchDto));
	}

	@PostMapping(value = "/retrieveDailySmltTmnlRsltByTime")
	public ResponseEntity<List<DsbdRsltDto>> retrieveDailySmltTmnlRsltByTime(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castDsbdService.retrieveDailySmltTmnlRsltByTime(searchDto));
	}

	@PostMapping(value = "/retrieveDailySmltFcltCard")
	public ResponseEntity<List<DsbdFcltCardDto>> retrieveDailySmltFcltCard(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castDsbdService.retrieveDailySmltFcltCard(searchDto));
	}
}
