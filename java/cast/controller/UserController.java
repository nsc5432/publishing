package aoms.pm.cast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.UserDto;
import aoms.pm.cast.service.UserService;
import aoms.pm.utils.ResponseUtils;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/cast/user")
@RequiredArgsConstructor
public class UserController {
	private final UserService userService;
	private final SessionService sessionService;
	
	@PostMapping(value = "/retrieveUserInfoBySession")
	public ResponseEntity<UserDto> retrieveUserInfoBySession() {
		UserDto dto = new UserDto();
		SessionUtils.setUserContext(dto, sessionService);
		
		if (dto.getLoginUserId() == null) {
			UserDto result = new UserDto();
			result.setError(true);
			result.setErrorMessage("로그인을 진행해주세요.");
			return ResponseUtils.res(result);
		}		
		
		return ResponseUtils.res(userService.retrieveUserInfoByKey(dto.getLoginUserId()));
	}
}
