import type { TimeRange } from '@/components/ui/time-range-selector';

/** 0~24 정수 시각을 `HH:00` 으로 */
export function formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
}

/** 운영 구간을 `06:00 ~ 20:00` 형태로 (구간이 여러 개면 콤마로 잇는다) */
export function formatRanges(ranges: TimeRange[]): string {
    if (ranges.length === 0) return '미설정';

    return [...ranges]
        .sort((a, b) => a.start - b.start)
        .map((range) => `${formatHour(range.start)} ~ ${formatHour(range.end)}`)
        .join(', ');
}

/** 운영 시간 합계 (시간) */
export function totalHours(ranges: TimeRange[]): number {
    return ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
}

/** 드로어 부제 — `T1 · 06:00 ~ 20:00 운영 (14시간)` */
export function formatOperating(terminal: string, ranges: TimeRange[]): string {
    if (ranges.length === 0) return `${terminal} · 운영시간 미설정`;

    return `${terminal} · ${formatRanges(ranges)} 운영 (${totalHours(ranges)}시간)`;
}

/** 구간을 시간 목록(0~23)으로 편다 */
export function toHourList(ranges: TimeRange[]): number[] {
    const hours = new Set<number>();
    ranges.forEach((range) => {
        for (let h = range.start; h < range.end; h += 1) hours.add(h);
    });

    return [...hours].sort((a, b) => a - b);
}
