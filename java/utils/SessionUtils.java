package aoms.pm.utils;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.framework.cmmn.service.SessionService;

public class SessionUtils {
	private SessionUtils() {
		throw new UnsupportedOperationException("SessionUtils Class is Utility class.");
	}
	
	public static <T extends AomsDefaultDto> void setUserContext(T entity, SessionService sessionService) {
		entity.setLoginUserId(sessionService.getLoginUserInfo().getLoginUserId());
		entity.setLoginIpAddr(sessionService.getLoginUserInfo().getLoginUserIp());
	}

}
