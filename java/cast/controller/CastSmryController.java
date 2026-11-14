package aoms.pm.cast.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.ChknCounterDto;
import aoms.pm.cast.dto.ChknCounterSearchDto;
import aoms.pm.cast.dto.DepHallDto;
import aoms.pm.cast.dto.DepHallSearchDto;
import aoms.pm.cast.dto.DsbdBaseInfoDto;
import aoms.pm.cast.dto.DsbdFcltCardDto;
import aoms.pm.cast.dto.DsbdHeaderDto;
import aoms.pm.cast.dto.DsbdRsltDto;
import aoms.pm.cast.dto.DsbdSearchDto;
import aoms.pm.cast.dto.FcltQueueScenarioDto;
import aoms.pm.cast.dto.FcltQueueScenarioSearchDto;
import aoms.pm.cast.dto.MapSearchDto;
import aoms.pm.cast.dto.SmltMapDto;
import aoms.pm.cast.dto.TmnlSmryDto;
import aoms.pm.cast.service.CastFcltQueueScenarioService;
import aoms.pm.cast.service.CastSmryDtlService;
import aoms.pm.cast.service.CastSmryService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

/**
 * 일일 시뮬레이션 결과 조회 — 요약보기 · 맵형태보기 · 체크인카운터 · 출국장
 */
@RestController
@RequestMapping("/cast")
@RequiredArgsConstructor
public class CastSmryController {
	private final CastSmryService castSmryService;
	private final CastSmryDtlService castSmryDtlService;
	private final CastFcltQueueScenarioService castFcltQueueScenarioService;

	@PostMapping(value = "/smry/retrieveDailySmltBaseInfo")
	public ResponseEntity<DsbdBaseInfoDto> retrieveDailySmltBaseInfo(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castSmryService.retrieveDailySmltBaseInfo(searchDto));
	}

	@PostMapping(value = "/smry/retrieveUserSmltBaseInfo")
	public ResponseEntity<DsbdBaseInfoDto> retrieveUserSmltBaseInfo(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castSmryService.retrieveUserSmltBaseInfo(searchDto));
	}

	@PostMapping(value = "/smry/retrieveDailySmltHeader")
	public ResponseEntity<DsbdHeaderDto> retrieveDailySmltHeader(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castSmryService.retrieveDailySmltHeader(searchDto));
	}

	@PostMapping(value = "/smry/retrieveDailySmltTmnlSmry")
	public ResponseEntity<TmnlSmryDto> retrieveDailySmltTmnlSmry(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castSmryService.retrieveDailySmltTmnlSmry(searchDto));
	}

	@PostMapping(value = "/smry/retrieveDailySmltTmnlRsltByTime")
	public ResponseEntity<List<DsbdRsltDto>> retrieveDailySmltTmnlRsltByTime(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castSmryService.retrieveDailySmltTmnlRsltByTime(searchDto));
	}

	@PostMapping(value = "/smry/retrieveDailySmltFcltCard")
	public ResponseEntity<List<DsbdFcltCardDto>> retrieveDailySmltFcltCard(@RequestBody DsbdSearchDto searchDto) {
		return ResponseUtils.res(castSmryService.retrieveDailySmltFcltCard(searchDto));
	}

	@PostMapping(value = "/smry/retrieveFcltQueueScenario")
	public ResponseEntity<FcltQueueScenarioDto> retrieveFcltQueueScenario(@RequestBody FcltQueueScenarioSearchDto searchDto) {
		return ResponseUtils.res(castFcltQueueScenarioService.retrieveFcltQueueScenario(searchDto));
	}

	@PostMapping(value = "/map/retrieveSmltMap")
	public ResponseEntity<SmltMapDto> retrieveSmltMap(@RequestBody MapSearchDto searchDto) {
		return ResponseUtils.res(castSmryDtlService.retrieveSmltMap(searchDto));
	}

	@PostMapping(value = "/chkn-counter/retrieveChknCounter")
	public ResponseEntity<ChknCounterDto> retrieveChknCounter(@RequestBody ChknCounterSearchDto searchDto) {
		return ResponseUtils.res(castSmryDtlService.retrieveChknCounter(searchDto));
	}

	@PostMapping(value = "/dep-hall/retrieveDepHall")
	public ResponseEntity<DepHallDto> retrieveDepHall(@RequestBody DepHallSearchDto searchDto) {
		return ResponseUtils.res(castSmryDtlService.retrieveDepHall(searchDto));
	}
}
