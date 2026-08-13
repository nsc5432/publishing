import {
    formatStep as formatTimelineStep,
    type TimelineRange,
} from '@/modules/pm/hooks/useTimeline';

/**
 * 체크인카운터 타임라인 구간 — 00:00 ~ 24:00 (24시간 / 30분).
 * 체크인은 새벽 출발편 때문에 이른 시각부터 열려 자원 활용 차트(0~23시)와 구간을 맞춘다.
 * 서버 슬롯(ChknCounterDto.slotList)도 같은 눈금으로 내려온다.
 */
export const TIMELINE_RANGE: TimelineRange = { startMin: 0, maxStep: 48 };

/** 타임라인 스텝 → HH:mm */
export function formatStep(step: number): string {
    return formatTimelineStep(TIMELINE_RANGE, step);
}
