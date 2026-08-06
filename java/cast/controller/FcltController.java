package aoms.pm.cast.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.FcltDto;
import aoms.pm.cast.dto.FcltSearchDto;
import aoms.pm.cast.service.FcltService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/fclt")
@RequiredArgsConstructor
public class FcltController {
	private final FcltService fcltService;
	
	@PostMapping(value = "/retrieveFcltList")
	public ResponseEntity<List<FcltDto>> retrieveFcltList(@RequestBody FcltSearchDto searchDto) {
		return ResponseUtils.res(fcltService.retrieveFcltList(searchDto.getTmnlId()));
	}
	
	@PostMapping(value = "/updatePosition")
	public ResponseEntity<Boolean> updatePosition(@RequestBody FcltDto dto) {
		fcltService.updatePosition(dto);
		return ResponseUtils.res(true);
	}
}
