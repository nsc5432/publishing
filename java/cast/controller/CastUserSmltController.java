package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.UserSmltChknDto;
import aoms.pm.cast.dto.UserSmltChknSaveDto;
import aoms.pm.cast.dto.UserSmltChknSearchDto;
import aoms.pm.cast.dto.UserSmltDepDto;
import aoms.pm.cast.dto.UserSmltDepSaveDto;
import aoms.pm.cast.dto.UserSmltDepSearchDto;
import aoms.pm.cast.dto.UserSmltExecDto;
import aoms.pm.cast.dto.UserSmltExecSearchDto;
import aoms.pm.cast.dto.UserSmltFcltMapDto;
import aoms.pm.cast.dto.UserSmltFcltMapSearchDto;
import aoms.pm.cast.dto.UserSmltFltPsgDto;
import aoms.pm.cast.dto.UserSmltFltPsgSaveDto;
import aoms.pm.cast.dto.UserSmltFltPsgSearchDto;
import aoms.pm.cast.dto.UserSmltInfoDto;
import aoms.pm.cast.dto.UserSmltInfoSearchDto;
import aoms.pm.cast.service.CastChknService;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.cast.service.CastFltPsgService;
import aoms.pm.cast.service.CastUserSmltService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/user-smlt")
@RequiredArgsConstructor
public class CastUserSmltController {
	private final CastUserSmltService castUserSmltService;
	private final CastFltPsgService castFltPsgService;
	private final CastChknService castChknService;
	private final CastDepService castDepService;

	@PostMapping(value = "/retrieveUserSmltInfo")
	public ResponseEntity<UserSmltInfoDto> retrieveUserSmltInfo(@RequestBody UserSmltInfoSearchDto searchDto) {
		return ResponseUtils.res(castUserSmltService.retrieveUserSmltInfo(searchDto));
	}

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

	@PostMapping(value = "/saveFltPsgInfo")
	public ResponseEntity<JsonResponse> saveFltPsgInfo(@RequestBody UserSmltFltPsgSaveDto saveDto) {
		return ResponseUtils.res(castFltPsgService.saveFltPsgInfo(saveDto));
	}

	@PostMapping(value = "/saveChknCounterInfo")
	public ResponseEntity<JsonResponse> saveChknCounterInfo(@RequestBody UserSmltChknSaveDto saveDto) {
		return ResponseUtils.res(castChknService.saveChknCounterInfo(saveDto));
	}

	@PostMapping(value = "/saveDepInfo")
	public ResponseEntity<JsonResponse> saveDepInfo(@RequestBody UserSmltDepSaveDto saveDto) {
		return ResponseUtils.res(castDepService.saveDepInfo(saveDto));
	}

	@PostMapping(value = "/retrieveFcltMap")
	public ResponseEntity<UserSmltFcltMapDto> retrieveFcltMap(@RequestBody UserSmltFcltMapSearchDto searchDto) {
		return ResponseUtils.res(castUserSmltService.retrieveFcltMap(searchDto));
	}

	@PostMapping(value = "/executeUserSmlt")
	public ResponseEntity<UserSmltExecDto> executeUserSmlt(@RequestBody UserSmltExecSearchDto searchDto) {
		return ResponseUtils.res(castUserSmltService.executeUserSmlt(searchDto));
	}
}
