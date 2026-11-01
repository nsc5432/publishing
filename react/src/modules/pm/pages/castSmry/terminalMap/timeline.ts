import type { TimelineRange } from '@/modules/pm/hooks/useTimeline';

/** 맵형태보기 타임라인 구간 — 00:00 ~ 24:00 (24시간 / 30분) */
export const TIMELINE_RANGE: TimelineRange = { startMin: 0, maxStep: 48 };
