package aoms.pm.cast.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.pm.cast.dto.DepRsltDto;
import aoms.pm.cast.dto.DepSearchDto;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.utils.ResponseUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/dep")
@RequiredArgsConstructor
public class CastDepController {
	private final CastDepService castDepService;
	
	@PostMapping(value = "/retrieveDepGroupByTime")
	public ResponseEntity<Map<String, List<DepRsltDto>>> retrieveDepGroupByTime(@RequestBody DepSearchDto searchDto) {
		return ResponseUtils.res(castDepService.retrieveDepGroupByTime(searchDto.getSmltId(), searchDto.getTmnlId()));
	}
	
	@PostMapping(value = "/retrieveDepGroupByTimeUsingDate")
	public ResponseEntity<Map<String, List<DepRsltDto>>> retrieveDepGroupByTimeUsingDate(@RequestBody DepSearchDto searchDto) {
		return ResponseUtils.res(castDepService.retrieveDepGroupByTimeUsingDate(searchDto.getYmd(), searchDto.getTmnlId()));
	}
}
