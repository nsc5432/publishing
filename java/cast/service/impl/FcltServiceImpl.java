package aoms.pm.cast.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.dto.FcltDto;
import aoms.pm.cast.mapper.FcltMapper;
import aoms.pm.cast.service.FcltService;
import aoms.pm.utils.SessionUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : FcltServiceImpl.java
 * @Description : 시설물 관리 ServiceImpl
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
@Service
@RequiredArgsConstructor	
@Transactional(rollbackFor = Exception.class)
public class FcltServiceImpl implements FcltService {
	private final FcltMapper fcltMapper;
	private final SessionService sessionService;

	@Override
	public List<FcltDto> retrieveFcltList(String tmnlId) {
		return fcltMapper.retrieveFcltList(tmnlId);
	}

	@Override
	public void updatePosition(FcltDto dto) {
		SessionUtils.setUserContext(dto, sessionService);
		fcltMapper.updatePosition(dto);
	}
}
