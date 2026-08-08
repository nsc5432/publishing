package aoms.pm.cast.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import aoms.pm.cast.dto.SlfDeviceCntRawDto;
import aoms.pm.cast.mapper.CastSlfchknMapper;
import aoms.pm.cast.service.CastSlfchknService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastSlfchknServiceImpl.java
 * @Description : 셀프체크인/백드랍 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * 2026. 08. 08. / 노세찬 / 구 셀프체크인 화면 전용 조회 2종 삭제
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class CastSlfchknServiceImpl implements CastSlfchknService {
	private final CastSlfchknMapper castSlfchknMapper;

	@Override
	public List<SlfDeviceCntRawDto> retrieveSlfDeviceCntList(String tmnlId) {
		return castSlfchknMapper.retrieveSlfDeviceCntList(tmnlId);
	}
}
