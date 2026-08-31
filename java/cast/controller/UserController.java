package aoms.pm.cast.controller;

import java.util.List;

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
			return ResponseUtils.res(error("로그인을 진행해주세요."));
		}

		UserDto result = userService.retrieveUserInfoByKey(dto.getLoginUserId());

		if (result == null) {
			return ResponseUtils.res(error("사용자 정보를 찾을 수 없습니다."));
		}

		// PM 롤이 하나도 없는 사용자는 오류가 아니다. 화면이 빈 목록을 보고 접근 권한 없음을 그린다
		if (result.getRoleIdList() == null) {
			result.setRoleIdList(List.of());
		}

		return ResponseUtils.res(result);
	}

	private UserDto error(String errorMessage) {
		UserDto result = new UserDto();
		result.setError(true);
		result.setErrorMessage(errorMessage);

		return result;
	}
}
