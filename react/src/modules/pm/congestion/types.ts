/** 터미널 비교 기준 대비 방향 — terminalMap.css 의 .stat__cmpr-diff--up 등 */
export type StatTrend = 'up' | 'down' | 'same';

export interface CongestionStatCmpr {
    /** 예: 전체 / 평균 */
    label: string;
    /** 예: 8,000명 */
    value: string;
    /** 예: 비중 2.5% · ▲ 30초 (+25%) */
    diff: string;
    trend: StatTrend | null;
}

export interface CongestionStat {
    /** terminalMap.css 의 .ico-wait-people 등 */
    ico: 'wait-people' | 'wait-time' | 'done-people' | 'done-time';
    label: string;
    value: string;
    unit: string;
    /** 강조(빨강) 표기 */
    point?: boolean;
    cmpr: CongestionStatCmpr;
}
