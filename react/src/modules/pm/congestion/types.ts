export interface CongestionStatCmpr {
    /** 예: 전체 / 평균 */
    label: string;
    /** 예: 8,000명 */
    value: string;
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
