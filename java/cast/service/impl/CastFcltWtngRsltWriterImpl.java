package aoms.pm.cast.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.dto.FcltWtngRsltDto;
import aoms.pm.cast.mapper.CastFcltWtngRsltMapper;
import aoms.pm.cast.service.CastFcltWtngRsltWriter;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastFcltWtngRsltWriterImpl.java
 * @Description : 시설 대기 결과 저장 단위 원자 삽입
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 10. 24. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class CastFcltWtngRsltWriterImpl implements CastFcltWtngRsltWriter {
	// 행당 바인드 25개 — Oracle 바인드 상한(65535) 아래로 나눈다
	private static final int INSERT_CHUNK_SIZE = 500;

	private final CastFcltWtngRsltMapper castFcltWtngRsltMapper;

	// 원천 수신 커밋 뒤에 불리므로 원천 트랜잭션에 참여하지 않고 새로 연다. 중복 키면 PK 위반으로 전체가 롤백된다
	@Override
	@Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
	public void insertScope(List<FcltWtngRsltDto> rowList) {
		for (int fromIndex = 0; fromIndex < rowList.size(); fromIndex += INSERT_CHUNK_SIZE) {
			castFcltWtngRsltMapper.insertFcltWtngRsltList(rowList.subList(fromIndex, Math.min(fromIndex + INSERT_CHUNK_SIZE, rowList.size())));
		}
	}
}
