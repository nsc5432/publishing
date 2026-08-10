import type { SmltType } from '@/types/api.types';
import type { SimulationType } from './types';

/**
 * 서버 DTO 값을 화면 표기로 옮기는 변환 모음.
 */

/** 값이 비었거나 형식이 어긋날 때 표기 */
const EMPTY = '-';

/** yyyyMMdd → yyyy/MM/dd (구분자 지정 가능) */
export function formatYmd(ymd: string, sep = '/'): string {
    if (!ymd || ymd.length !== 8) return EMPTY;

    return [ymd.slice(0, 4), ymd.slice(4, 6), ymd.slice(6, 8)].join(sep);
}

/** yyyyMMddHHmmss → yyyy-MM-dd HH:mm:ss */
export function formatDateTime(dt: string): string {
    if (!dt || dt.length !== 14) return EMPTY;

    return `${formatYmd(dt.slice(0, 8), '-')} ${dt.slice(8, 10)}:${dt.slice(10, 12)}:${dt.slice(12, 14)}`;
}

/** HHmm → HH:mm */
export function formatHhmm(hhmm: string): string {
    if (!hhmm || hhmm.length !== 4) return EMPTY;

    return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

/** 분 → HH:mm (대기시간 / 처리시간 표기) */
export function formatMinutes(minutes: number): string {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(Math.round(minutes % 60)).padStart(2, '0');

    return `${hh}:${mm}`;
}

/** 증감 표기 — 부호를 항상 붙이고 천단위를 끊는다 */
export function formatDiff(count: number): string {
    return `${count >= 0 ? '+' : '-'}${Math.abs(count).toLocaleString()}`;
}

/** 천단위 구분 */
export function formatCount(count: number): string {
    return count.toLocaleString();
}

/** yyyyMMdd → 요일 약어 (SUN ~ SAT) */
export function dowLabel(ymd: string): string {
    if (!ymd || ymd.length !== 8) return '';

    const date = new Date(
        Number(ymd.slice(0, 4)),
        Number(ymd.slice(4, 6)) - 1,
        Number(ymd.slice(6, 8)),
    );

    return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()];
}

/** 오늘 (yyyyMMdd) — 최초 진입 조회 기준일자 */
export function todayYmd(): string {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}${mm}${dd}`;
}

/** 서버 시뮬레이션 구분 → 화면 뱃지 구분 */
export function toSimulationType(smltType: SmltType): SimulationType {
    return smltType === 'USER' ? 'user' : 'daily';
}

/* ================= 선택 가능 시각 (avlTimes, HHmm) ================= */

/** 선택 가능한 시 목록 (중복 제거·오름차순) */
export function toHourOptions(avlTimes: string[]): string[] {
    return [...new Set(avlTimes.map((time) => time.slice(0, 2)))].sort();
}

/** 특정 시에 고를 수 있는 분 목록 */
export function toMinuteOptions(avlTimes: string[], hour: string): string[] {
    return avlTimes
        .filter((time) => time.slice(0, 2) === hour)
        .map((time) => time.slice(2, 4))
        .sort();
}

/** 기본 선택 시각 — 계산이 끝난 가장 늦은 시각 */
export function defaultTime(avlTimes: string[]): string {
    if (avlTimes.length === 0) return '';

    return [...avlTimes].sort().at(-1) as string;
}

/**
 * 시 또는 분을 바꾼 뒤의 시각을 선택 가능한 값으로 맞춘다.
 */
export function resolveTime(avlTimes: string[], hour: string, minute: string): string {
    if (avlTimes.includes(hour + minute)) return hour + minute;

    const minutes = toMinuteOptions(avlTimes, hour);
    if (minutes.length === 0) return defaultTime(avlTimes);

    // 고른 분에 가장 가까운(넘지 않는) 값으로, 그마저 없으면 그 시의 첫 분으로 내린다.
    const nearest = minutes.filter((m) => m <= minute).at(-1) ?? minutes[0];

    return hour + nearest;
}
