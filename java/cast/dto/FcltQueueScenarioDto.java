package aoms.pm.cast.dto;

import java.util.List;

import aoms.pm.cast.enums.FcltQueueScenarioMode;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/** 요약보기 시설 카드 혼잡해소 시나리오 팝업 */
@Getter
@Setter
public class FcltQueueScenarioDto extends JsonResponse {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId;
	private FcltType fcltType;
	private String unitCd;
	private String fcltNm;
	private FcltQueueScenarioMode mode;
	private String baseDt; // 계산 기준 Queue 스냅샷 일시 yyyyMMddHHmmss
	private String obsBgnDt; // 관측구간 시작 yyyyMMddHHmmss
	private String obsEndDt; // 관측구간 종료 yyyyMMddHHmmss
	private String dataSrc; // CAST / XOVIS
	private String contextVersion;
	private String ctxChgYn; // 요청의 contextVersion 과 원천이 달라졌으면 Y (scenario · recommend 없이 새 기준만 내린다)
	private Integer wtngPsgCnt; // 기준시각 대기인원 Q0 (명)
	private Integer targetQueueCnt; // 해소 기준 대기인원 Q* (명, 이하)
	private Integer oprFcltCnt; // 현재 운영 수량 (개)
	private Integer totCnt; // 이 큐에 배정 가능한 최대 수량 (개). 모르면 null
	private String totCntRsn; // totCnt 가 null 인 사유
	private Double arvlRate; // 유입률 (명/분)
	private Double srvcRate; // 시설 1개 처리율 (명/분)
	private QueueMetricDto arvlMetric;
	private QueueMetricDto srvcMetric;
	private int dfltTargetMin;
	private int minTargetMin;
	private int maxTargetMin;
	private List<String> asmpList; // 적용 가정
	private FcltQueueClearDto current;
	private FcltQueueClearDto scenario; // COUNT: 조정 수량, TIME: 추천 수량(최대수 이하일 때)
	private FcltQueueClearDto totScenario; // TIME 에서 추천이 최대수를 넘을 때 최대수 전량 배정 결과
	private FcltQueueRecommendDto recommend; // TIME 전용
}
