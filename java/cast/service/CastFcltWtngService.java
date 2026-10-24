package aoms.pm.cast.service;

import aoms.pm.cast.domains.wtng.FcltWtngDay;
import aoms.pm.cast.domains.wtng.FcltWtngScope;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

public interface CastFcltWtngService {
	/**
	 * 저장 결과가 기대 시설 · 범위를 모두 채우면 그대로, 없거나 불완전하면 Java 계산으로 보완한 10분 통계.
	 * 혼잡등급 기준표는 조회 시점 값이다. 보완 결과는 저장하지 않는다.
	 * @param smltStng 조회할 실행 · 모델의 설정 (CastSmltService.retrieveUniqueSmltStng)
	 */
	FcltWtngDay retrieveFcltWtngDay(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType);

	/** smltStng 의 모델 원천으로 계산한 저장 단위 10분 통계 */
	FcltWtngScope calculateScope(SmltStngDto smltStng, TerminalKind tmnlId, FcltType fcltType);
}
