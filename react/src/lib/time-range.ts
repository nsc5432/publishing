import { pad2 } from './format';

/**
 * 24슬롯 운영시간 구간 — 시간대 선택 UI(components/ui/time-range-selector)와
 * 그 값을 읽는 화면(userSmlt 탭 / 블럭 차트 / 검색대 격자)이 함께 쓴다.
 *
 * 슬롯 하나가 1시간이고 end 는 포함하지 않는다 (06:00~20:00 이면 start 6, end 20).
 */
export interface TimeRange {
    start: number;
    end: number;
}

/** 0~24 정수 시각을 `HH:00` 으로 */
export function formatHour(hour: number): string {
    return `${pad2(hour)}:00`;
}

/** 그 시각이 운영 구간 안에 드는가 */
export function isHourInRanges(hour: number, ranges: TimeRange[]): boolean {
    return ranges.some((range) => hour >= range.start && hour < range.end);
}

/** 구간을 시간 목록(0~23)으로 편다 */
export function toHourList(ranges: TimeRange[]): number[] {
    const hours = new Set<number>();
    ranges.forEach((range) => {
        for (let hour = range.start; hour < range.end; hour += 1) hours.add(hour);
    });

    return [...hours].sort((a, b) => a - b);
}

/** 운영 시간 합계 (시간) */
export function totalHours(ranges: TimeRange[]): number {
    return ranges.reduce((sum, range) => sum + (range.end - range.start), 0);
}

/**
 * 운영 구간을 `06:00 ~ 20:00` 형태로 (구간이 여러 개면 콤마로 잇는다).
 * 비었을 때 문구는 부르는 쪽이 정한다 — 드로어는 '미설정', 선택 UI 는 '선택 없음'.
 */
export function formatRanges(ranges: TimeRange[], emptyText: string): string {
    if (ranges.length === 0) return emptyText;

    return [...ranges]
        .sort((a, b) => a.start - b.start)
        .map((range) => `${formatHour(range.start)} ~ ${formatHour(range.end)}`)
        .join(', ');
}
