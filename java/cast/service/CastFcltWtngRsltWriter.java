package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.dto.FcltWtngRsltDto;

public interface CastFcltWtngRsltWriter {
	/** 저장 단위 하나의 전체 행을 새 트랜잭션 하나로 넣는다. 기존 행을 지우거나 덮어쓰지 않는다 */
	void insertScope(List<FcltWtngRsltDto> rowList);
}
