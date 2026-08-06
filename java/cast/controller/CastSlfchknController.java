package aoms.pm.cast.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.SlfchknRsltDto;
import aoms.pm.cast.dto.SlfchknSearchDto;
import aoms.pm.cast.service.CastSlfchknService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/slfchkn")
@RequiredArgsConstructor
public class CastSlfchknController {
	private final CastSlfchknService castSlfchknService;
	
	@PostMapping(value = "/retrieveSlfchknGroupByTime")
	public ResponseEntity<Map<String, List<SlfchknRsltDto>>> retrieveSlfchknGroupByTime(@RequestBody SlfchknSearchDto searchDto) {
		return ResponseUtils.res(castSlfchknService.retrieveSlfchknGroupByTime(searchDto.getSmltId(), searchDto.getTmnlId()));
	}
	
	@PostMapping(value = "/retrieveSlfchknGroupByTimeUsingDate")
	public ResponseEntity<Map<String, List<SlfchknRsltDto>>> retrieveSlfchknGroupByTimeUsingDate(@RequestBody SlfchknSearchDto searchDto) {
		return ResponseUtils.res(castSlfchknService.retrieveSlfchknGroupByTimeUsingDate(searchDto.getYmd(), searchDto.getTmnlId()));
	}
}
