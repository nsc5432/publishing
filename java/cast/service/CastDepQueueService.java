package aoms.pm.cast.service;

import java.util.Map;

import aoms.pm.cast.domains.dsbd.DepQueueDay;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.TerminalKind;

public interface CastDepQueueService {
	/** smltStng 의 모델 SC / SR 결과 하루치 (전날 0시 ~ 다음 날 00:00 결과) */
	DepQueueDay calculateDepQueueDay(SmltStngDto smltStng, TerminalKind tmnlId);

	/** 출국장별 운영 보안검색대 수 (실행 리소스 운영표) */
	Map<String, Integer> retrieveScrtyOpenCntMap(SmltStngDto smltStng, TerminalKind tmnlId);
}
