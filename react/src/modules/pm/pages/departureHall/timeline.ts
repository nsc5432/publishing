/**
 * 출국장 화면 타임라인 눈금.
 *
 * 조회 시각(hhmm)을 만드는 규칙이라 조회 데이터와 함께 움직인다.
 * 서버 추이(DepHallTrendDto.timeList)도 같은 눈금으로 내려온다.
 */

/** 재생 단위(분) */
export const TIMELINE_STEP_MIN = 30;
/** 타임라인 시작 시각(분) — 출국장은 04:00 부터 그린다 */
export const TIMELINE_BGN_MIN = 4 * 60;
/** 04:00 ~ 24:00 (20시간 / 30분) */
export const TIMELINE_MAX_STEP = 40;
/** 재생 간격(ms) */
export const TIMELINE_INTERVAL = 600;

/** 타임라인 스텝 → HH:mm */
export function formatStep(step: number) {
    const minutes = TIMELINE_BGN_MIN + step * TIMELINE_STEP_MIN;
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
