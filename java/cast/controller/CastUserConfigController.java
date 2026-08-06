package aoms.pm.cast.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.UserConfigChknDto;
import aoms.pm.cast.dto.UserConfigFlightDto;
import aoms.pm.cast.dto.UserConfigSearchDto;
import aoms.pm.cast.service.CastUserConfigService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/user-config")
@RequiredArgsConstructor
public class CastUserConfigController {
	private final CastUserConfigService castUserConfigService;
	
	@PostMapping(value = "/retrieveFlightList")
	public ResponseEntity<List<UserConfigFlightDto>> retrieveFlightList(@RequestBody UserConfigSearchDto searchDto) {
		return ResponseUtils.res(castUserConfigService.retrieveFlightList(searchDto.getYmd(), searchDto.getTmnlId()));
	}
	
	@PostMapping(value = "/retrieveChknMapGroupByIsland")
	public ResponseEntity<Map<String, List<UserConfigChknDto>>> retrieveChknMapGroupByIsland(@RequestBody UserConfigSearchDto searchDto) {
		return ResponseUtils.res(castUserConfigService.retrieveChknMapGroupByIsland(searchDto.getYmd(), searchDto.getTmnlId()));
	}
}
