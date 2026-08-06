package aoms.pm.cast.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.ChknRsltDto;
import aoms.pm.cast.dto.ChknSearchDto;
import aoms.pm.cast.dto.SummaryRsltDto;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/chkn")
@RequiredArgsConstructor
public class CastChknController {
	private final CastChknService castChknService;
	
	@PostMapping(value = "/retrieveChknGroupByTime")
	public ResponseEntity<Map<String, List<ChknRsltDto>>> retrieveChknGroupByTime(@RequestBody ChknSearchDto searchDto) {
		return ResponseUtils.res(castChknService.retrieveChknGroupByTime(searchDto.getSmltId(), searchDto.getTmnlId(), searchDto.getIsland()));
	}
	
	@PostMapping(value = "/retrieveChknGroupByTimeUsingDate")
	public ResponseEntity<Map<String, List<ChknRsltDto>>> retrieveChknGroupByTimeUsingDate(@RequestBody ChknSearchDto searchDto) {
		return ResponseUtils.res(castChknService.retrieveChknGroupByTimeUsingDate(searchDto.getYmd(), searchDto.getTmnlId(), searchDto.getIsland()));
	}
	
	@PostMapping(value = "/retrieveChknXovisGroupByTime")
	public ResponseEntity<List<SummaryRsltDto>> retrieveChknXovisGroupByTime(@RequestBody ChknSearchDto searchDto) {
		return ResponseUtils.res(castChknService.retrieveChknXovisGroupByTime(searchDto.getYmd(), searchDto.getTmnlId(), searchDto.getIsland()));
	}
}
