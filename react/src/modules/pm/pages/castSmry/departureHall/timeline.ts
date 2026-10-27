import {
    formatStep as formatTimelineStep,
    type TimelineRange,
} from '@/modules/pm/hooks/useTimeline';

/**
 * 출국장 타임라인 구간 — 00:00 ~ 24:00 (24시간 / 30분).
 * 출국장 운영 전 시간도 포함한다. 서버 슬롯(DepHallDto.slotList)도 같은 눈금으로 내려온다.
 */
export const TIMELINE_RANGE: TimelineRange = { startMin: 0, maxStep: 48 };

/** 타임라인 스텝 → HH:mm */
export function formatStep(step: number): string {
    return formatTimelineStep(TIMELINE_RANGE, step);
}
