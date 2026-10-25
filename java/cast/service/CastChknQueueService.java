package aoms.pm.cast.service;

import java.util.List;

import aoms.pm.cast.domains.chkn.ChknQueueDay;
import aoms.pm.cast.domains.chkn.ChknQueueTmnlSeries;
import aoms.pm.cast.domains.chkn.ChknSbdDay;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.enums.TerminalKind;

public interface CastChknQueueService {
	/** 공용 Queue 대상 아일랜드 — 배정이 없어도 미운영 0 으로 계산한다 */
	List<String> CHKN_ISLAND_CD_LIST = List.of("A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N");

	/** 차트 / 일일 KPI 용 1분 Queue. 기존 차트 경로처럼 모델을 거르지 않는다 */
	ChknQueueDay retrieveChknQueueDay(SmltStngDto smltStng, TerminalKind tmnlId);

	/** smltStng 의 모델 결과만으로 계산한 1분 Queue. 혼잡등급 기준표를 읽지 않는다 */
	ChknQueueTmnlSeries calculateChknQueue(SmltStngDto smltStng, TerminalKind tmnlId);

	ChknSbdDay retrieveChknSbdDay(String smltId, TerminalKind tmnlId, String excnYmd);
}
