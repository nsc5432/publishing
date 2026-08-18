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

/** yyyyMMdd → yyyy-MM-dd (input[type=date] 값). 형식이 어긋나면 빈 값 */
export function toDateInputValue(ymd: string): string {
    if (!ymd || ymd.length !== 8) return '';

    return formatYmd(ymd, '-');
}

/** yyyy-MM-dd (input[type=date] 값) → yyyyMMdd */
export function toYmd(dateInputValue: string): string {
    return dateInputValue.replace(/\D/g, '');
}

/* ================= 조회 조건 시각 (HHmm) ================= */

/** 조회 조건 시 목록 — 00 ~ 23 (1시간 단위) */
export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => pad2(hour));

/** 조회 조건 분 목록 — 10분 단위 */
export const MINUTE_OPTIONS = ['00', '10', '20', '30', '40', '50'];

/** 분 선택 간격 (분) */
const MINUTE_STEP = 60 / MINUTE_OPTIONS.length;

/** HHmm → 자정으로부터의 분 */
function toMinuteOfDay(hhmm: string): number {
    return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4));
}

/** 현재 시각을 분 선택 간격에 맞춰 내린 값 (HHmm) */
function nowHhmm(): string {
    const now = new Date();

    return pad2(now.getHours()) + pad2(Math.floor(now.getMinutes() / MINUTE_STEP) * MINUTE_STEP);
}

/**
 * 기본 선택 시각 — 현재 시각에 가장 가까운 선택 가능 시각.
 *
 * 화면에 들어오면 "지금" 을 보고 싶어 하지, 계산이 끝난 마지막 시각을 보고 싶어 하지 않는다.
 * 아직 계산되지 않은 시각은 목록에 없으므로 자연히 가장 늦은 시각으로 내려앉는다.
 * (목록이 비면 현재 시각을 그대로 쓴다)
 */
export function defaultTime(avlTimes: string[]): string {
    const now = toMinuteOfDay(nowHhmm());

    if (avlTimes.length === 0) return nowHhmm();

    return avlTimes.reduce((nearest, time) =>
        Math.abs(toMinuteOfDay(time) - now) < Math.abs(toMinuteOfDay(nearest) - now)
            ? time
            : nearest,
    );
}
