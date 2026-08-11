/**
 * 서버 DTO 값을 화면 표기로 옮기는 변환 모음 (화면 공용).
 */

/** 값이 비었거나 형식이 어긋날 때 표기 */
const EMPTY = '-';

/** 두 자리 0 채움 (시각 · 분 · 초 표기 공용) */
export function pad2(value: number | string): string {
    return String(value).padStart(2, '0');
}

/** yyyyMMdd → yyyy/MM/dd (구분자 지정 가능) */
export function formatYmd(ymd: string, separator = '/'): string {
    if (!ymd || ymd.length !== 8) return EMPTY;

    return [ymd.slice(0, 4), ymd.slice(4, 6), ymd.slice(6, 8)].join(separator);
}

/** yyyyMMddHHmmss → yyyy-MM-dd HH:mm:ss */
export function formatDateTime(dateTime: string): string {
    if (!dateTime || dateTime.length !== 14) return EMPTY;

    return `${formatYmd(dateTime.slice(0, 8), '-')} ${dateTime.slice(8, 10)}:${dateTime.slice(10, 12)}:${dateTime.slice(12, 14)}`;
}

/** HHmm → HH:mm */
export function formatHhmm(hhmm: string): string {
    if (!hhmm || hhmm.length !== 4) return EMPTY;

    return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
}

/** 분 → HH:mm (대기시간 / 처리시간 표기) */
export function formatMinutes(minutes: number): string {
    const hours = pad2(Math.floor(minutes / 60));
    const mins = pad2(Math.round(minutes % 60));

    return `${hours}:${mins}`;
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
    const month = pad2(now.getMonth() + 1);
    const day = pad2(now.getDate());

    return `${now.getFullYear()}${month}${day}`;
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

    const minuteOptions = toMinuteOptions(avlTimes, hour);
    if (minuteOptions.length === 0) return defaultTime(avlTimes);

    // 고른 분에 가장 가까운(넘지 않는) 값으로, 그마저 없으면 그 시의 첫 분으로 내린다.
    const nearest =
        minuteOptions.filter((candidateMinute) => candidateMinute <= minute).at(-1) ??
        minuteOptions[0];

    return hour + nearest;
}
