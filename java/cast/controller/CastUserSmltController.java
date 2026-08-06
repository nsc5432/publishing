package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.UserSmltChknDto;
import aoms.pm.cast.dto.UserSmltChknSearchDto;
import aoms.pm.cast.dto.UserSmltDepDto;
import aoms.pm.cast.dto.UserSmltDepSearchDto;
import aoms.pm.cast.dto.UserSmltFltPsgDto;
import aoms.pm.cast.dto.UserSmltFltPsgSearchDto;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.cast.service.CastFltPsgService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/user-smlt")
@RequiredArgsConstructor
public class CastUserSmltController {
	private final CastFltPsgService castFltPsgService;
	private final CastChknService castChknService;
	private final CastDepService castDepService;

	@PostMapping(value = "/retrieveFltPsgInfo")
	public ResponseEntity<UserSmltFltPsgDto> retrieveFltPsgInfo(@RequestBody UserSmltFltPsgSearchDto searchDto) {
		return ResponseUtils.res(castFltPsgService.retrieveFltPsgInfo(searchDto));
	}

	@PostMapping(value = "/retrieveChknCounterInfo")
	public ResponseEntity<UserSmltChknDto> retrieveChknCounterInfo(@RequestBody UserSmltChknSearchDto searchDto) {
		return ResponseUtils.res(castChknService.retrieveChknCounterInfo(searchDto));
	}

	@PostMapping(value = "/retrieveDepInfo")
	public ResponseEntity<UserSmltDepDto> retrieveDepInfo(@RequestBody UserSmltDepSearchDto searchDto) {
		return ResponseUtils.res(castDepService.retrieveDepInfo(searchDto));
	}
}
