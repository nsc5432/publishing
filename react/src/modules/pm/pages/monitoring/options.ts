import { formatYmd, todayYmd } from '@/modules/pm/pages/dashboard/format';
import type { RangeCondition } from './types';

/** 화면 타이틀 (GNB) */
export const TITLE = 'PM 예측관리 / 시뮬레이션 모니터링';

/** 00 ~ 23 시 */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
/** 10분 단위 */
export const MINUTE_OPTIONS = ['00', '10', '20', '30', '40', '50'];

/** 최초 조회 조건 — 오늘 하루 전체 */
export function defaultRange(): RangeCondition {
    const date = formatYmd(todayYmd());

    return {
        startDate: date,
        startHour: '00',
        startMinute: '00',
        endDate: date,
        endHour: '23',
        endMinute: '50',
    };
}

/** 조회 조건(날짜 + 시 + 분) → 서버가 받는 yyyyMMddHHmm */
export function toDateTime(date: string, hour: string, minute: string): string {
    return `${date.replace(/\D/g, '')}${hour}${minute}`;
}
