import { formatYmd, todayYmd } from '@/lib/format';
import type { RangeCondition } from './types';

/** 화면 타이틀 (GNB) */
export const TITLE = 'PM 예측관리 / 시뮬레이션 모니터링';

/** 최초 조회 조건 — 오늘 하루 전체 */
export function defaultRange(): RangeCondition {
    const today = formatYmd(todayYmd());

    return {
        startDate: today,
        startHour: '00',
        startMinute: '00',
        endDate: today,
        endHour: '23',
        endMinute: '50',
    };
}

/** 조회 조건(날짜 + 시 + 분) → 서버가 받는 yyyyMMddHHmm */
export function toDateTime(date: string, hour: string, minute: string): string {
    return `${date.replace(/\D/g, '')}${hour}${minute}`;
}
