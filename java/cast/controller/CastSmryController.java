package aoms.pm.cast.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.SmltSmryDepSearchDto;
import aoms.pm.cast.dto.SmltSmryMapSearchDto;
import aoms.pm.cast.dto.SmltSmrySearchDto;
import aoms.pm.cast.dto.SummaryMapDto;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/smry")
@RequiredArgsConstructor
public class CastSmryController {
	private final CastSmltService castSmltService;
	
	@PostMapping(value = "/retrieveRcntDailySmltId")
	public ResponseEntity<String> retrieveRcntDailySmltId(@RequestBody SmltSmrySearchDto searchDto) {
		return ResponseUtils.res(castSmltService.retrieveRecentSmltId(searchDto.getYmd()));
	}
	
	@PostMapping(value = "/retrieveDailySmltSmry")
	public ResponseEntity<JsonResponse> retrieveDailySmltSmry(@RequestBody SmltSmrySearchDto searchDto) {
		return ResponseUtils.res(castSmltService.retrieveDailySmltSmry(searchDto.getSmltId(), searchDto.getCongestionType()));
	}
	
	@PostMapping(value = "/retrieveDailySmltSmryDepChart")
	public ResponseEntity<List<SummaryRsltDto>> retrieveDailySmltSmryDepChart(@RequestBody SmltSmryDepSearchDto searchDto) {
		return ResponseUtils.res(castSmltService.retrieveDailySmltSmryDepChart(searchDto));
	}
	
	@PostMapping(value = "/retrieveSmltSmryMap")
	public ResponseEntity<Map<String, SummaryMapDto>> retrieveSmltSmryMap(@RequestBody SmltSmryMapSearchDto searchDto) {
		return ResponseUtils.res(castSmltService.retrieveSmltSmryMap(searchDto));
	}
}
