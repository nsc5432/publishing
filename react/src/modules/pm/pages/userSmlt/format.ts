import { formatRanges as formatRangeList, totalHours, type TimeRange } from '@/lib/time-range';

export { formatHour, toHourList, totalHours } from '@/lib/time-range';

/** 운영 구간을 `06:00 ~ 20:00` 형태로 (구간이 여러 개면 콤마로 잇는다) */
export function formatRanges(ranges: TimeRange[]): string {
    return formatRangeList(ranges, '미설정');
}

/** 드로어 부제 — `T1 · 06:00 ~ 20:00 운영 (14시간)` */
export function formatOperating(terminal: string, ranges: TimeRange[]): string {
    if (ranges.length === 0) return `${terminal} · 운영시간 미설정`;

    return `${terminal} · ${formatRanges(ranges)} 운영 (${totalHours(ranges)}시간)`;
}
