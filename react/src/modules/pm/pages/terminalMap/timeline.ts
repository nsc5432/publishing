/**
 * 맵형태보기 타임라인 눈금.
 *
 * 조회 시각(hhmm)을 만드는 규칙이라 조회 데이터와 함께 움직인다.
 */

/** 재생 단위(분) */
export const TIMELINE_STEP_MIN = 30;
/** 00:00 ~ 24:00 (24시간 / 30분) */
export const TIMELINE_MAX_STEP = 48;
/** 재생 간격(ms) */
export const TIMELINE_INTERVAL = 600;

/** 타임라인 스텝 → HH:mm */
export function formatStep(step: number) {
    const minutes = step * TIMELINE_STEP_MIN;
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
