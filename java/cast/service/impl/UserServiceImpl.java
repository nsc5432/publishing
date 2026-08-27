package aoms.pm.cast.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.UserDto;
import aoms.pm.cast.mapper.UserMapper;
import aoms.pm.cast.service.UserService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : UserServiceImpl.java
 * @Description : 유저 정보 관리 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service("UserService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class UserServiceImpl implements UserService {
	private final UserMapper userMapper;

	@Override
	public UserDto retrieveUserInfoByKey(String userId) {
		return userMapper.retrieveUserInfoByKey(userId);
	}
}
