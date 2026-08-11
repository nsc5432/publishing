import {
    formatStep as formatTimelineStep,
    type TimelineRange,
} from '@/modules/pm/hooks/useTimeline';

/**
 * 출국장 타임라인 구간 — 04:00 ~ 24:00 (20시간 / 30분).
 * 그 앞은 출국장이 열리지 않는다. 서버 추이(DepHallTrendDto.timeList)도 같은 눈금으로 내려온다.
 */
export const TIMELINE_RANGE: TimelineRange = { startMin: 4 * 60, maxStep: 40 };

/** 타임라인 스텝 → HH:mm */
export function formatStep(step: number): string {
    return formatTimelineStep(TIMELINE_RANGE, step);
}
